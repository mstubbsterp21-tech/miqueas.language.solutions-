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
const brandLogoUrl = process.env.EMAIL_LOGO_URL || "https://miqueaslanguagesolutions.com/logo.png";
const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "m.stubbs@miqueaslanguagesolutions.com";
const supportPhoneDisplay = process.env.EMAIL_SUPPORT_PHONE || "(321) 379-8010";
const supportPhoneLink = process.env.EMAIL_SUPPORT_PHONE_LINK || "+13213798010";
const websiteUrl = process.env.EMAIL_WEBSITE_URL || "https://miqueaslanguagesolutions.com";
const websiteDisplay = process.env.EMAIL_WEBSITE_DISPLAY || "miqueaslanguagesolutions.com";

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
    ? "The requested document is now overdue. Please upload it through your secure MLS portal as soon as possible."
    : isReminder
      ? "This is a reminder that MLS is still waiting for the document below."
      : "MLS has requested a document from you.";
  const instructions = request.instructions || "No additional instructions were provided.";
  const safeTitle = escapeHtml(request.title);
  const safeInstructions = escapeHtml(instructions).replaceAll("\n", "<br>");
  const safeName = escapeHtml(name);
  const safeHeading = escapeHtml(subject.replace(" | MLS", ""));
  const safeLogoUrl = escapeHtml(brandLogoUrl);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeSupportPhoneDisplay = escapeHtml(supportPhoneDisplay);
  const safeSupportPhoneLink = escapeHtml(supportPhoneLink);
  const safeWebsiteUrl = escapeHtml(websiteUrl);
  const safeWebsiteDisplay = escapeHtml(websiteDisplay);

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
    "MLS Portal Support",
    supportEmail,
    supportPhoneDisplay,
    websiteDisplay,
    "",
    "Miqueas Language Solutions",
    "Bridging Perspectives. Delivering Understanding.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeHeading}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .mls-shell { padding: 16px 8px !important; }
      .mls-masthead-cell { display: block !important; width: 100% !important; text-align: center !important; }
      .mls-logo-cell { padding: 0 0 16px !important; }
      .mls-contact-cell { padding: 0 !important; text-align: center !important; }
      .mls-heading { font-size: 24px !important; }
      .mls-content { padding: 22px 18px !important; }
    }
  </style>
</head>
<body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#24130e">
  <div class="mls-shell" style="max-width:640px;margin:0 auto;padding:28px 16px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#ffffff;border-radius:24px 24px 0 0">
      <tr>
        <td style="padding:24px 28px;text-align:center">
          <img src="${safeLogoUrl}" width="230" alt="Miqueas Language Solutions" style="display:inline-block;width:230px;max-width:80%;height:auto;border:0;margin:0 auto">
        </td>
      </tr>
    </table>
    <div style="background:#24130e;color:#fff;padding:24px 28px">
      <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6b34c">Document request</div>
      <h1 class="mls-heading" style="margin:10px 0 0;font-size:28px;line-height:1.2">${safeHeading}</h1>
    </div>
    <div class="mls-content" style="background:#fff;border-radius:0 0 24px 24px;padding:28px;box-shadow:0 12px 40px rgba(36,19,14,.10)">
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
      <div style="margin-top:28px;border-top:1px solid #eadfd8;padding-top:20px;text-align:center;font-size:12px;line-height:1.75;color:#6b625e"><strong style="color:#721100">Miqueas Language Solutions</strong><br><span style="color:#721100;font-weight:700">Bridging Perspectives. Delivering Understanding.</span><br><a href="mailto:${safeSupportEmail}" style="color:#721100">${safeSupportEmail}</a> · ${safeSupportPhoneDisplay}<br><a href="${safeWebsiteUrl}" style="color:#721100">${safeWebsiteDisplay}</a></div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

function createResponseReader(socket) {
  let buffer = "";
  let current = [];
  const queued = [];
  const waiters = [];
  let terminalError = null;

  function flush(response) {
    const waiter = waiters.shift();
    if (waiter) waiter.resolve(response);
    else queued.push(response);
  }

  function fail(error) {
    terminalError = error;
    while (waiters.length) waiters.shift().reject(error);
  }

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line) continue;
      current.push(line);
      if (/^\d{3} /.test(line)) {
        const code = Number(line.slice(0, 3));
        flush({ code, text: current.join("\n") });
        current = [];
      }
    }
  });
  socket.on("error", fail);
  socket.on("close", () => {
    if (waiters.length && !terminalError) fail(new Error("SMTP connection closed unexpectedly."));
  });

  return {
    next(expectedCodes, timeoutMs = 12000) {
      const response = queued.shift();
      if (response) {
        if (!expectedCodes.includes(response.code)) throw new Error(`SMTP ${response.code}: ${response.text}`);
        return Promise.resolve(response);
      }
      if (terminalError) return Promise.reject(terminalError);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("SMTP response timed out.")), timeoutMs);
        waiters.push({
          resolve: (value) => {
            clearTimeout(timer);
            if (!expectedCodes.includes(value.code)) reject(new Error(`SMTP ${value.code}: ${value.text}`));
            else resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
      });
    },
  };
}

async function command(socket, reader, value, expectedCodes) {
  socket.write(`${value}\r\n`);
  return reader.next(expectedCodes);
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
  const reader = createResponseReader(socket);
  socket.setTimeout(15000, () => socket.destroy(new Error("SMTP connection timed out.")));

  try {
    await new Promise((resolve, reject) => {
      if (socket.authorized) return resolve();
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });
    await reader.next([220]);
    await command(socket, reader, "EHLO miqueaslanguagesolutions.com", [250]);
    await command(socket, reader, "AUTH LOGIN", [334]);
    await command(socket, reader, Buffer.from(smtpUser).toString("base64"), [334]);
    await command(socket, reader, Buffer.from(smtpPass).toString("base64"), [235]);
    await command(socket, reader, `MAIL FROM:<${fromEmail}>`, [250]);
    await command(socket, reader, `RCPT TO:<${to}>`, [250, 251]);
    await command(socket, reader, "DATA", [354]);
    socket.write(`${message}\r\n.\r\n`);
    await reader.next([250]);
    await command(socket, reader, "QUIT", [221]).catch(() => null);
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
