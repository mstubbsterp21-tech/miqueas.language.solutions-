import {
  calendarScope,
  driveScope,
  getGoogleWorkspaceAccessToken,
  sendGmailEmail,
} from "./gmail-oauth.js";

const portalBaseUrl = process.env.MLS_PORTAL_URL || "https://miqueaslanguagesolutions.com/portal";
const brandLogoUrl = process.env.EMAIL_LOGO_URL || "https://miqueaslanguagesolutions.com/logo.png";
const supportEmail = process.env.EMAIL_SUPPORT_ADDRESS || "m.stubbs@miqueaslanguagesolutions.com";
const supportPhone = process.env.EMAIL_SUPPORT_PHONE || "(321) 379-8010";
const adminEmails = (process.env.VITE_ADMIN_EMAILS || supportEmail)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uniqueEmails(values) {
  return [...new Set(values
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^\S+@\S+\.\S+$/.test(value)))];
}

function assignmentUrl(assignmentId, section = "assignments") {
  const url = new URL(portalBaseUrl);
  url.searchParams.set("section", section);
  url.searchParams.set("assignment", assignmentId);
  return url.toString();
}

function assignmentName(assignment) {
  return assignment.clients?.organization_name
    || assignment.clients?.primary_contact_name
    || assignment.clients?.email
    || "MLS client";
}

function formatDateTime(value, timezone = "America/New_York") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "Date pending");
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone || "America/New_York",
  }).format(date);
}

function endAt(assignment) {
  if (assignment.end_at) return assignment.end_at;
  const start = new Date(assignment.start_at);
  if (Number.isNaN(start.getTime())) return assignment.start_at;
  return new Date(start.getTime() + 60 * 60 * 1000).toISOString();
}

function locationText(assignment) {
  if (assignment.delivery_mode === "VRI") return assignment.meeting_link || "Virtual — link pending";
  return assignment.location_name
    || [assignment.address_line_1, assignment.city, assignment.state, assignment.postal_code].filter(Boolean).join(", ")
    || "Location pending";
}

function safeFolderName(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|#%{}[\]~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function googleJson(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || `Google Workspace request failed (${response.status}).`);
    error.status = response.status;
    error.google = data;
    throw error;
  }
  return data;
}

async function integrationRow(db) {
  const result = await db.from("gmail_integrations")
    .select("id,calendar_id,calendar_summary,drive_root_folder_id,drive_root_folder_url")
    .eq("id", "primary")
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function updateAssignment(db, assignmentId, values) {
  const result = await db.from("assignments")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data;
}

async function ensureAssignmentCalendar(db, accessToken) {
  const integration = await integrationRow(db);
  if (integration?.calendar_id) {
    try {
      const calendar = await googleJson(
        accessToken,
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(integration.calendar_id)}`,
      );
      return { id: calendar.id, summary: calendar.summary || integration.calendar_summary || "MLS Assignments" };
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }

  const listed = await googleJson(
    accessToken,
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250&minAccessRole=writer",
  );
  let calendar = (listed.items || []).find((item) => item.summary === "MLS Assignments");
  if (!calendar) {
    calendar = await googleJson(accessToken, "https://www.googleapis.com/calendar/v3/calendars", {
      method: "POST",
      body: JSON.stringify({
        summary: "MLS Assignments",
        description: "Assignment requests and confirmed interpreting work managed through MLS Portal.",
        timeZone: "America/New_York",
      }),
    });
  }

  const saved = await db.from("gmail_integrations").update({
    calendar_id: calendar.id,
    calendar_summary: calendar.summary || "MLS Assignments",
    workspace_last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", "primary");
  if (saved.error) throw saved.error;
  return { id: calendar.id, summary: calendar.summary || "MLS Assignments" };
}

async function ensureDriveRoot(db, accessToken) {
  const integration = await integrationRow(db);
  if (integration?.drive_root_folder_id) {
    try {
      const folder = await googleJson(
        accessToken,
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(integration.drive_root_folder_id)}?fields=id,name,webViewLink,trashed`,
      );
      if (!folder.trashed) {
        return {
          id: folder.id,
          name: folder.name || "MLS Assignments",
          url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
        };
      }
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }

  const params = new URLSearchParams({
    q: "name = 'MLS Assignments' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    spaces: "drive",
    fields: "files(id,name,webViewLink)",
    pageSize: "100",
  });
  const listed = await googleJson(accessToken, `https://www.googleapis.com/drive/v3/files?${params}`);
  let folder = listed.files?.[0];
  if (!folder) {
    folder = await googleJson(accessToken, "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
      method: "POST",
      body: JSON.stringify({
        name: "MLS Assignments",
        mimeType: "application/vnd.google-apps.folder",
        appProperties: { mlsManaged: "true", mlsPurpose: "assignment_root" },
      }),
    });
  }
  const url = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;
  const saved = await db.from("gmail_integrations").update({
    drive_root_folder_id: folder.id,
    drive_root_folder_url: url,
    workspace_last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", "primary");
  if (saved.error) throw saved.error;
  return { id: folder.id, name: folder.name || "MLS Assignments", url };
}

function calendarEvent(assignment, confirmed) {
  const client = assignmentName(assignment);
  const statusLabel = confirmed ? "CONFIRMED" : "REQUEST";
  const portalUrl = assignmentUrl(assignment.id);
  return {
    summary: `[${statusLabel}] ${assignment.service_type} — ${client}`,
    description: [
      `MLS Portal assignment ${assignment.id}`,
      `Status: ${confirmed ? "Confirmed" : "New request"}`,
      `Client: ${client}`,
      `Service: ${assignment.service_type}`,
      `Delivery: ${assignment.delivery_mode}`,
      `Participants: ${assignment.deaf_participants ?? "Not provided"} Deaf / ${assignment.hearing_participants ?? "Not provided"} hearing`,
      assignment.specialty ? `Specialty: ${assignment.specialty}` : "",
      assignment.description ? `Details: ${assignment.description}` : "",
      "",
      `Open in MLS Portal: ${portalUrl}`,
    ].filter(Boolean).join("\n"),
    location: locationText(assignment),
    start: {
      dateTime: assignment.start_at,
      timeZone: assignment.timezone || "America/New_York",
    },
    end: {
      dateTime: endAt(assignment),
      timeZone: assignment.timezone || "America/New_York",
    },
    transparency: confirmed ? "opaque" : "transparent",
    colorId: confirmed ? "10" : "5",
    extendedProperties: {
      private: {
        mlsAssignmentId: assignment.id,
        mlsLifecycle: confirmed ? "confirmed" : "request_received",
      },
    },
  };
}

export async function syncAssignmentCalendar(db, assignment, { confirmed = false } = {}) {
  const access = await getGoogleWorkspaceAccessToken(db, [calendarScope]);
  if (!access.accessToken) {
    await updateAssignment(db, assignment.id, {
      calendar_sync_status: "not_configured",
      calendar_last_error: access.error || "Calendar access is not configured.",
    });
    return { status: "not_configured", error: access.error };
  }

  try {
    const calendar = await ensureAssignmentCalendar(db, access.accessToken);
    const body = JSON.stringify(calendarEvent(assignment, confirmed));
    let event;
    if (assignment.google_calendar_event_id) {
      try {
        event = await googleJson(
          access.accessToken,
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events/${encodeURIComponent(assignment.google_calendar_event_id)}?sendUpdates=none`,
          { method: "PUT", body },
        );
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
    if (!event) {
      event = await googleJson(
        access.accessToken,
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?sendUpdates=none`,
        { method: "POST", body },
      );
    }

    await updateAssignment(db, assignment.id, {
      google_calendar_event_id: event.id,
      google_calendar_html_link: event.htmlLink || null,
      calendar_sync_status: "synced",
      calendar_last_synced_at: new Date().toISOString(),
      calendar_last_error: null,
    });
    return {
      status: "synced",
      calendarId: calendar.id,
      calendarSummary: calendar.summary,
      eventId: event.id,
      eventUrl: event.htmlLink || null,
    };
  } catch (error) {
    await updateAssignment(db, assignment.id, {
      calendar_sync_status: "failed",
      calendar_last_error: error.message,
    });
    return { status: "failed", error: error.message };
  }
}

export async function ensureAssignmentDriveFolder(db, assignment) {
  const access = await getGoogleWorkspaceAccessToken(db, [driveScope]);
  if (!access.accessToken) {
    await updateAssignment(db, assignment.id, {
      drive_sync_status: "not_configured",
      drive_last_error: access.error || "Drive access is not configured.",
    });
    return { status: "not_configured", error: access.error };
  }

  try {
    const root = await ensureDriveRoot(db, access.accessToken);
    if (assignment.drive_folder_id) {
      try {
        const existing = await googleJson(
          access.accessToken,
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(assignment.drive_folder_id)}?fields=id,name,webViewLink,trashed`,
        );
        if (!existing.trashed) {
          const url = existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`;
          await updateAssignment(db, assignment.id, {
            drive_folder_url: url,
            drive_sync_status: "synced",
            drive_last_synced_at: new Date().toISOString(),
            drive_last_error: null,
          });
          return { status: "synced", folderId: existing.id, folderUrl: url, rootFolderUrl: root.url };
        }
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }

    const search = new URLSearchParams({
      q: `'${root.id}' in parents and appProperties has { key='mlsAssignmentId' and value='${assignment.id}' } and trashed = false`,
      spaces: "drive",
      fields: "files(id,name,webViewLink)",
      pageSize: "10",
    });
    const listed = await googleJson(access.accessToken, `https://www.googleapis.com/drive/v3/files?${search}`);
    let folder = listed.files?.[0];
    if (!folder) {
      const date = new Date(assignment.start_at);
      const datePart = Number.isNaN(date.getTime()) ? "Date TBD" : date.toISOString().slice(0, 10);
      const name = safeFolderName(`${datePart} — ${assignmentName(assignment)} — ${assignment.service_type} — ${assignment.id.slice(0, 8)}`);
      folder = await googleJson(access.accessToken, "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
        method: "POST",
        body: JSON.stringify({
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [root.id],
          appProperties: {
            mlsAssignmentId: assignment.id,
            mlsManaged: "true",
          },
        }),
      });
    }
    const url = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;
    await updateAssignment(db, assignment.id, {
      drive_folder_id: folder.id,
      drive_folder_url: url,
      drive_sync_status: "synced",
      drive_last_synced_at: new Date().toISOString(),
      drive_last_error: null,
    });
    return { status: "synced", folderId: folder.id, folderUrl: url, rootFolderUrl: root.url };
  } catch (error) {
    await updateAssignment(db, assignment.id, {
      drive_sync_status: "failed",
      drive_last_error: error.message,
    });
    return { status: "failed", error: error.message };
  }
}

function brandedEmail({ eyebrow, heading, greeting, intro, details = [], buttonLabel, buttonUrl, footerNote = "" }) {
  const safeDetails = details
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;font-size:13px;font-weight:700;color:#721100;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:13px;line-height:1.6;color:#51453f">${escapeHtml(value).replaceAll("\n", "<br>")}</td></tr>`)
    .join("");
  const text = [
    greeting,
    "",
    intro,
    "",
    ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    "",
    `${buttonLabel}: ${buttonUrl}`,
    footerNote ? `\n${footerNote}` : "",
    "",
    "MLS Portal Support",
    supportEmail,
    supportPhone,
    "",
    "Miqueas Language Solutions",
    "Bridging Perspectives. Delivering Understanding.",
  ].filter((line) => line !== "").join("\n");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f7f3ef;font-family:Arial,sans-serif;color:#24130e">
<div style="max-width:660px;margin:0 auto;padding:28px 14px">
  <div style="background:#fff;border-radius:24px 24px 0 0;padding:24px;text-align:center">
    <img src="${escapeHtml(brandLogoUrl)}" alt="Miqueas Language Solutions" width="230" style="display:inline-block;max-width:80%;height:auto">
  </div>
  <div style="background:#24130e;color:#fff;padding:24px 28px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f6b34c">${escapeHtml(eyebrow)}</div>
    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.25">${escapeHtml(heading)}</h1>
  </div>
  <div style="background:#fff;border-radius:0 0 24px 24px;padding:28px;box-shadow:0 12px 40px rgba(36,19,14,.10)">
    <p style="font-size:16px;line-height:1.6;margin-top:0">${escapeHtml(greeting)}</p>
    <p style="font-size:15px;line-height:1.7;color:#51453f">${escapeHtml(intro)}</p>
    <table role="presentation" width="100%" style="margin:22px 0;padding:14px 18px;border:1px solid #eadfd8;border-radius:18px;background:#fffaf5">${safeDetails}</table>
    <p style="text-align:center;margin:28px 0"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#721100;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">${escapeHtml(buttonLabel)}</a></p>
    ${footerNote ? `<p style="font-size:13px;line-height:1.6;color:#6b625e;background:#f7f3ef;padding:14px 16px;border-radius:14px">${escapeHtml(footerNote)}</p>` : ""}
    <div style="margin-top:28px;border-top:1px solid #eadfd8;padding-top:20px;text-align:center;font-size:12px;line-height:1.75;color:#6b625e"><strong style="color:#721100">Miqueas Language Solutions</strong><br><span style="color:#721100;font-weight:700">Bridging Perspectives. Delivering Understanding.</span><br>${escapeHtml(supportEmail)} · ${escapeHtml(supportPhone)}<br>miqueaslanguagesolutions.com</div>
  </div>
</div>
</body></html>`;
  return { text, html };
}

async function deliverIndividually(db, recipients, message) {
  const emails = uniqueEmails(recipients);
  if (!emails.length) return { status: "skipped", recipients: [], deliveries: [] };
  const deliveries = [];
  for (const email of emails) {
    const delivery = await sendGmailEmail(db, { to: email, ...message });
    deliveries.push({ email, ...delivery });
  }
  const sent = deliveries.filter((item) => item.sent);
  const failed = deliveries.filter((item) => !item.sent);
  return {
    status: sent.length === deliveries.length ? "sent" : sent.length ? "partial" : (failed[0]?.status || "failed"),
    recipients: emails,
    deliveries,
    messageId: sent[0]?.messageId || null,
    threadId: sent[0]?.threadId || null,
    error: failed.map((item) => `${item.email}: ${item.error}`).join(" | ") || null,
  };
}

export async function sendAssignmentRequestEmails(db, assignment) {
  const portalUrl = assignmentUrl(assignment.id);
  const clientName = assignment.clients?.primary_contact_name || assignmentName(assignment);
  const details = [
    ["Service", assignment.service_type],
    ["Requested time", formatDateTime(assignment.start_at, assignment.timezone)],
    ["Delivery", assignment.delivery_mode],
    ["Location", locationText(assignment)],
    ["Request ID", assignment.id],
  ];
  const clientCopy = brandedEmail({
    eyebrow: "Assignment request received",
    heading: "MLS received your interpreting request",
    greeting: `Hello ${clientName || "there"},`,
    intro: "Your request is now in the MLS assignment pipeline for review. You can follow updates, messages, documents, and confirmation status in MLS Portal.",
    details,
    buttonLabel: "View request in MLS Portal",
    buttonUrl: portalUrl,
    footerNote: "This email confirms receipt only. The assignment is not confirmed until MLS completes review and staffing.",
  });
  const adminCopy = brandedEmail({
    eyebrow: "New client request",
    heading: `${assignmentName(assignment)} submitted an interpreting request`,
    greeting: "Hello Micah,",
    intro: "A new request was submitted through MLS Portal and is ready in Open Assignments.",
    details,
    buttonLabel: "Open assignment",
    buttonUrl: portalUrl,
  });

  const [clientDelivery, adminDelivery] = await Promise.all([
    deliverIndividually(db, [assignment.clients?.email], {
      subject: `MLS received your interpreting request | ${assignment.service_type}`,
      ...clientCopy,
    }),
    deliverIndividually(db, adminEmails, {
      subject: `New MLS assignment request | ${assignmentName(assignment)}`,
      ...adminCopy,
    }),
  ]);
  const statuses = [clientDelivery.status, adminDelivery.status];
  const status = statuses.every((value) => value === "sent")
    ? "sent"
    : statuses.some((value) => value === "sent" || value === "partial")
      ? "partial"
      : statuses.includes("not_configured")
        ? "not_configured"
        : statuses.every((value) => value === "skipped")
          ? "skipped"
          : "failed";
  const error = [clientDelivery.error, adminDelivery.error].filter(Boolean).join(" | ") || null;
  await updateAssignment(db, assignment.id, {
    request_email_status: status,
    request_email_sent_at: status === "sent" || status === "partial" ? new Date().toISOString() : null,
    request_email_last_error: error,
  });
  return { status, client: clientDelivery, admin: adminDelivery, error };
}

export async function sendAssignmentConfirmationEmails(db, assignment) {
  const portalUrl = assignmentUrl(assignment.id);
  const interpreterEmails = (assignment.assignment_interpreters || [])
    .filter((link) => !["declined", "cancelled"].includes(link.status))
    .map((link) => link.interpreters?.email);
  const recipients = uniqueEmails([assignment.clients?.email, ...interpreterEmails]);
  const copy = brandedEmail({
    eyebrow: "Assignment confirmed",
    heading: `${assignment.service_type} is confirmed`,
    greeting: "Hello,",
    intro: "MLS has confirmed this assignment. The portal now contains the current logistics, assigned team, messages, documents, and future updates.",
    details: [
      ["Client", assignmentName(assignment)],
      ["Date and time", formatDateTime(assignment.start_at, assignment.timezone)],
      ["Delivery", assignment.delivery_mode],
      ["Location", locationText(assignment)],
      ["Assignment ID", assignment.id],
    ],
    buttonLabel: "Open confirmed assignment",
    buttonUrl: portalUrl,
    footerNote: "Use the assignment conversation in MLS Portal for preparation and logistics so the full team has one record.",
  });
  const delivery = await deliverIndividually(db, recipients, {
    subject: `Confirmed: ${assignment.service_type} | MLS`,
    ...copy,
  });
  await updateAssignment(db, assignment.id, {
    confirmation_email_status: delivery.status,
    confirmation_email_sent_at: ["sent", "partial"].includes(delivery.status) ? new Date().toISOString() : null,
    confirmation_email_last_error: delivery.error || null,
  });
  return delivery;
}

export async function sendAssignmentMessageEmails(db, assignment, message, sender) {
  const interpreterEmails = (assignment.assignment_interpreters || [])
    .filter((link) => !["declined", "cancelled"].includes(link.status))
    .map((link) => link.interpreters?.email);
  const recipients = uniqueEmails([
    assignment.clients?.email,
    ...interpreterEmails,
    ...adminEmails,
  ]).filter((email) => email !== String(sender.email || "").toLowerCase());
  const portalUrl = assignmentUrl(assignment.id, sender.isAdmin ? "assignments" : sender.metadataRole === "interpreter" ? "work" : "assignments");
  const senderName = [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.email || "An MLS Portal user";
  const copy = brandedEmail({
    eyebrow: "New assignment message",
    heading: `${senderName} sent a portal message`,
    greeting: "Hello,",
    intro: message.body,
    details: [
      ["Assignment", assignment.service_type],
      ["Client", assignmentName(assignment)],
      ["Date and time", formatDateTime(assignment.start_at, assignment.timezone)],
      ["Sent by", `${senderName} (${message.sender_role})`],
    ],
    buttonLabel: "Reply in MLS Portal",
    buttonUrl: portalUrl,
    footerNote: "Reply inside MLS Portal so the message stays attached to the assignment record. Email replies are not imported into the portal.",
  });
  const delivery = await deliverIndividually(db, recipients, {
    subject: `New MLS Portal message | ${assignment.service_type}`,
    ...copy,
  });
  const update = await db.from("assignment_messages").update({
    email_status: delivery.status,
    email_recipients: delivery.recipients,
    gmail_message_id: delivery.messageId || null,
    gmail_thread_id: delivery.threadId || null,
    email_sent_at: ["sent", "partial"].includes(delivery.status) ? new Date().toISOString() : null,
    email_last_error: delivery.error || null,
  }).eq("id", message.id);
  if (update.error) throw update.error;
  return delivery;
}

export async function runRequestAutomation(db, assignment) {
  const [calendar, drive, email] = await Promise.all([
    syncAssignmentCalendar(db, assignment, { confirmed: false }),
    ensureAssignmentDriveFolder(db, assignment),
    sendAssignmentRequestEmails(db, assignment),
  ]);
  return { calendar, drive, email };
}

export async function runConfirmationAutomation(db, assignment) {
  const [calendar, drive, email] = await Promise.all([
    syncAssignmentCalendar(db, assignment, { confirmed: true }),
    ensureAssignmentDriveFolder(db, assignment),
    sendAssignmentConfirmationEmails(db, assignment),
  ]);
  return { calendar, drive, email };
}
