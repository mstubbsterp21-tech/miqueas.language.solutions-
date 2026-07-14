import crypto from "node:crypto";
import tls from "node:tls";

const portalUrl = process.env.MLS_PORTAL_URL || "https://miqueaslanguagesolutions.com/portal?section=documents";
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const fromEmail = process.env.EMAIL_FROM || smtpUser;
const fromName = process.env.EMAIL_FROM_NAME || "Miqueas Language Solutions";
const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;

export function getEmailConfiguration() {
  return {
    configured: Boolean(smtpHost && smtpPort && smtpUser && smtpPass && fromEmail),
    host: smtpHost,
    port: smtpPort,
    fromEmail,
    fromName,
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function encodeHeader(value) {
  const text = String(value || "");
  return /^[\x20-\x7E]*$/.test(text)
    ? text
    : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function formatDueDate(value) {
  if (!value) return "No due date specified";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function emailCopy(request, owner, eventType) {
  const name = request.recipient_name || owner.name || "there";
  const due = formatDueDate(request.due_date);
  const isReminder = eventType !== "initial" && eventType !== "manual_resend";
  const overdue = eventType === "overdue_reminder";
  const subject = overdue
    ? `Overdue document: ${request.title} | MLS`
    : isReminder
      ? `Reminder: ${request.title} is due soon | MLS`
      : `Document requested: ${request.title} | MLS`;
  const lead = overdue
    ? `The requested document is now overdue. Please upload it through your secure MLS portal as soon as possible.`
    : isReminder
      ? `This is a reminder that MLS is still waiting for the document below.`
      : `MLS has requested a document from you.`;
  const instructions = request.instructions || "No additional instructions were provided.";
  const safeTitle = escapeHtml(request.title);
  const safeInstructions = escapeHtml(instructions).replaceAll("\n", "<br>");
  const safeName = escapeHtml(name);

  const text = [
    `Hello ${name},`,
    "",
    lead,
    "",
    `Document: ${request.title}`,
    `Due date: ${due}`,
    `Instructions: ${instructions}`,
    "",
    `Upload securely: ${portalUrl}`,
    "",
    "For privacy and security, please upload the document through the MLS portal rather than replying with an attachment.",
    "",
    "Miqueas Language Solutions",
    "Bridging Perspectives. Delivering Understanding.",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#24130e">
  <div style="max-width:640px;margin:0 auto;padding:28px 16px">
    <div style="background:#24130e;color:#fff;border-radius:24px 24px 0 0;padding:28px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6b34c">Miqueas Language Solutions</div>
      <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">${encodeHeader(subject.replace(" | MLS", ""))}</h1>
    </div>
    <div style="background:#fff;border-radius:0 0 24px 24px;padding:28px;box-shadow:0 12px 40px rgba(36,19,14,.10)">
      <p style="font-size:16px;line-height:1.6;margin-top:0">Hello ${safeName},</p>
      <p style="font-size:15px;line-height:1.7;color:#51453f">${escapeHtml(lead)}</p>
      <div style="margin:24px 0;padding:20px;border:1px solid #eadfd8;border-radius:18px;background:#fffaf5">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#dd7d00">Requested document</div>
        <h2 style="margin:8px 0 14px;font-size:20px">${safeTitle}</h2>
        <p style="margin:0 0 10px;font-size:14px"><strong>Due date:</strong> ${escapeHtml(due)}</p>
        <p style="margin:0;font-size:14px;line-height:1.6"><strong>Instructions:</strong><br>${safeInstructions}</p>
      </div>
      <p style="text-align:center;margin:26px 0"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#721100;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">Open secure document center</a></p>
      <p style="font-size:13px;line-height:1.6;color:#6b625e;background:#f7f3ef;padding:14px 16px;border-radius:14px">For privacy and security, upload the document through the MLS portal. Please do not reply to this email with the document attached.</p>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6">Miqueas Language Solutions<br><span style="color:#721100;font-weight:700">Bridging Perspectives. Delivering Understanding.</span></p>
    </div>
  </div>
</body></html>`;

  return { subject, text, html };
}

function readResponse(socket, expectedCodes) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timeout = setTimeout(() => cleanup(new Error("SMTP response timed out.")), 12000);
    function cleanup(error, value) {
      clearTimeout(timeout);
      socket.off("data", onData);
      socket.off("error", onError);
      if (error) reject(error);
      else resolve(value);
    }
    function onError(error) { cleanup(error); }
    function onData(chunk) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const final = [...lines].reverse().find((line) => /^\d{3} /.test(line));
      if (!final) return;
      const code = Number(final.slice(0, 3));
      if (!expectedCodes.includes(code)) return cleanup(new Error(`SMTP ${code}: ${final.slice(4)}`));
      cleanup(null, final);
    }
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

async function command(socket, value, expectedCodes) {
  socket.write(`${value}\r\n`);
  return readResponse(socket, expectedCodes);
}

export async function sendSmtpEmail({ to, subject, text, html }) {
  const configuration = getEmailConfiguration();
  if (!configuration.configured) {
    return { sent: false, status: "not_configured", error: "SMTP email delivery is not configured in Vercel." };
  }

  const messageId = `<${crypto.randomUUID()}@miqueaslanguagesolutions.com>`;
  const boundary = `mls_${crypto.randomUUID().replaceAll("-", "")}`;
  const message = [
    `From: ${encodeHeader(fromName)} <${fromEmail}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n").replace(/\r\n\./g, "\r\n..");

  const socket = tls.connect({ host: smtpHost, port: smtpPort, servername: smtpHost, rejectUnauthorized: true });
  socket.setTimeout(15000, () => socket.destroy(new Error("SMTP connection timed out.")));

  try {
    await new Promise((resolve, reject) => {
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });
    await readResponse(socket, [220]);
    await command(socket, "EHLO miqueaslanguagesolutions.com", [250]);
    await command(socket, "AUTH LOGIN", [334]);
    await command(socket, Buffer.from(smtpUser).toString("base64"), [334]);
    await command(socket, Buffer.from(smtpPass).toString("base64"), [235]);
    await command(socket, `MAIL FROM:<${fromEmail}>`, [250]);
    await command(socket, `RCPT TO:<${to}>`, [250, 251]);
    await command(socket, "DATA", [354]);
    socket.write(`${message}\r\n.\r\n`);
    await readResponse(socket, [250]);
    await command(socket, "QUIT", [221]).catch(() => null);
    return { sent: true, status: "sent", messageId };
  } catch (error) {
    return { sent: false, status: "failed", error: error.message || "Email delivery failed." };
  } finally {
    socket.destroy();
  }
}

export function createDocumentRequestEmail(request, owner, eventType = "initial") {
  return emailCopy(request, owner, eventType);
}

export function calculateNextReminder(dueDate, eventType = "initial") {
  if (!dueDate) return null;
  const today = new Date();
  today.setUTCHours(13, 0, 0, 0);
  const due = new Date(`${dueDate}T13:00:00Z`);
  if (Number.isNaN(due.getTime())) return null;
  if (eventType === "overdue_reminder") return new Date(today.getTime() + 7 * 864e5).toISOString();
  const threeDaysBefore = new Date(due.getTime() - 3 * 864e5);
  const candidate = threeDaysBefore > today ? threeDaysBefore : due > today ? due : new Date(today.getTime() + 864e5);
  return candidate.toISOString();
}
