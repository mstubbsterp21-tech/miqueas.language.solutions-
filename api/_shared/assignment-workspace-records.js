import { calendarScope, driveScope, getGoogleWorkspaceAccessToken } from "./gmail-oauth.js";
import { ensureAssignmentDriveFolder } from "./assignment-automations.js";

async function integration(db) {
  const result = await db.from("gmail_integrations").select("calendar_id").eq("id", "primary").maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function googleJson(accessToken, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { authorization: `Bearer ${accessToken}`, ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || `Google Workspace request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function recordPayload(assignment) {
  return {
    source: "MLS Portal",
    synced_at: new Date().toISOString(),
    assignment: {
      id: assignment.id,
      client_id: assignment.client_id,
      client: assignment.clients || null,
      service_type: assignment.service_type,
      delivery_mode: assignment.delivery_mode,
      start_at: assignment.start_at,
      end_at: assignment.end_at,
      timezone: assignment.timezone,
      location_name: assignment.location_name,
      address_line_1: assignment.address_line_1,
      address_line_2: assignment.address_line_2,
      city: assignment.city,
      state: assignment.state,
      postal_code: assignment.postal_code,
      meeting_link: assignment.meeting_link,
      deaf_participants: assignment.deaf_participants,
      hearing_participants: assignment.hearing_participants,
      language_preferences: assignment.language_preferences,
      specialty: assignment.specialty,
      team_requested: assignment.team_requested,
      cdi_requested: assignment.cdi_requested,
      onsite_contact_name: assignment.onsite_contact_name,
      onsite_contact_phone: assignment.onsite_contact_phone,
      description: assignment.description,
      preparation_materials: assignment.preparation_materials,
      purchase_order_number: assignment.purchase_order_number,
      client_reference: assignment.client_reference,
      status: assignment.status,
      lifecycle_status: assignment.lifecycle_status,
      payment_status: assignment.payment_status,
      invoice_number: assignment.invoice_number,
      invoice_amount: assignment.invoice_amount,
      admin_notes: assignment.admin_notes,
      assigned_interpreters: assignment.assignment_interpreters || [],
      portal_url: `https://miqueaslanguagesolutions.com/portal?section=assignments&assignment=${assignment.id}`,
    },
  };
}

async function uploadRecord(accessToken, folderId, assignment, existingId = null) {
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({
    name: "MLS Assignment Record.json",
    ...(existingId ? {} : { parents: [folderId] }),
    appProperties: { mlsAssignmentId: assignment.id, mlsPurpose: "assignment_record", mlsManaged: "true" },
  })], { type: "application/json" }));
  form.append("file", new Blob([JSON.stringify(recordPayload(assignment), null, 2)], { type: "application/json" }), "MLS Assignment Record.json");
  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id,name,webViewLink`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
  const response = await fetch(url, { method: existingId ? "PATCH" : "POST", headers: { authorization: `Bearer ${accessToken}` }, body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw new Error(data.error?.message || "Google Drive could not sync the assignment record.");
  return data;
}

export async function syncAssignmentWorkspaceRecord(db, assignment) {
  const access = await getGoogleWorkspaceAccessToken(db, [driveScope]);
  if (!access.accessToken) return { status: "not_configured", error: access.error };
  try {
    const folder = await ensureAssignmentDriveFolder(db, assignment);
    if (folder.status !== "synced" || !folder.folderId) throw new Error(folder.error || "Assignment Drive folder is unavailable.");
    const search = new URLSearchParams({
      q: `'${folder.folderId}' in parents and appProperties has { key='mlsPurpose' and value='assignment_record' } and trashed = false`,
      spaces: "drive",
      fields: "files(id,name,webViewLink)",
      pageSize: "10",
    });
    const listed = await googleJson(access.accessToken, `https://www.googleapis.com/drive/v3/files?${search}`);
    const file = await uploadRecord(access.accessToken, folder.folderId, assignment, listed.files?.[0]?.id || null);
    return { status: "synced", fileId: file.id, fileUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view` };
  } catch (error) {
    return { status: "failed", error: error.message };
  }
}

export async function removeAssignmentWorkspaceRecords(db, assignment) {
  const [calendarAccess, driveAccess, settings] = await Promise.all([
    getGoogleWorkspaceAccessToken(db, [calendarScope]),
    getGoogleWorkspaceAccessToken(db, [driveScope]),
    integration(db),
  ]);
  const result = { calendar: { status: "skipped" }, drive: { status: "skipped" } };
  if (assignment.google_calendar_event_id && settings?.calendar_id && calendarAccess.accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(settings.calendar_id)}/events/${encodeURIComponent(assignment.google_calendar_event_id)}?sendUpdates=none`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${calendarAccess.accessToken}` },
      });
      if (!response.ok && response.status !== 404 && response.status !== 410) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || `Google Calendar deletion failed (${response.status}).`);
      }
      result.calendar = { status: "deleted" };
    } catch (error) {
      result.calendar = { status: "failed", error: error.message };
    }
  } else if (!calendarAccess.accessToken) {
    result.calendar = { status: "not_configured", error: calendarAccess.error };
  }
  if (assignment.drive_folder_id && driveAccess.accessToken) {
    try {
      await googleJson(driveAccess.accessToken, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(assignment.drive_folder_id)}`, { method: "PATCH", body: JSON.stringify({ trashed: true }) });
      result.drive = { status: "trashed" };
    } catch (error) {
      result.drive = { status: "failed", error: error.message };
    }
  } else if (!driveAccess.accessToken) {
    result.drive = { status: "not_configured", error: driveAccess.error };
  }
  return result;
}
