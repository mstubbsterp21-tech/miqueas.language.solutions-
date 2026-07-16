import { database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import { loadOperationsV2 } from "./_shared/ops-v2-load.js";
import { adminCreateQuote, adminSendQuote, clientRespondQuote } from "./_shared/ops-v2-quotes.js";
import { adminLinkFoundInvoice } from "./_shared/ops-v2-found-invoices.js";
import { adminLinkFoundContractorPayment } from "./_shared/ops-v2-found-contractors.js";
import { interpreterSubmitTime, adminReviewTime } from "./_shared/ops-v2-time.js";
import { interpreterSubmitExpense, adminReviewExpense } from "./_shared/ops-v2-expenses.js";
import { interpreterSaveAvailability, interpreterSaveWeeklyAvailability, interpreterDeleteAvailability } from "./_shared/ops-v2-availability.js";
import { adminSaveCredential, adminUpdateOnboarding } from "./_shared/ops-v2-compliance.js";
import { adminLinkBoldSignAgreement } from "./_shared/ops-v2-boldsign.js";
import { adminUpdateFullAssignment, adminSyncAssignmentWorkspaceRecord, adminDeleteAssignment } from "./_shared/ops-v2-assignments.js";
import {
  loadCommunications,
  createCommunicationConversation,
  createCommunicationUploadUrl,
  sendPortalDirectMessage,
  publishPortalAnnouncement,
  markPortalAnnouncementRead,
  openCommunicationAttachment,
  deletePortalAnnouncement,
} from "./_shared/ops-v2-communications.js";
import {
  saveProfileCustomization,
  createProfileMediaUploadUrl,
  recordProfileMediaUpload,
  removeProfileMedia,
} from "./_shared/ops-v2-profiles.js";

const actions = {
  adminCreateQuote,
  adminSendQuote,
  clientRespondQuote,
  adminLinkFoundInvoice,
  adminLinkFoundContractorPayment,
  interpreterSubmitTime,
  adminReviewTime,
  interpreterSubmitExpense,
  adminReviewExpense,
  interpreterSaveAvailability,
  interpreterSaveWeeklyAvailability,
  interpreterDeleteAvailability,
  adminSaveCredential,
  adminUpdateOnboarding,
  adminLinkBoldSignAgreement,
  adminUpdateFullAssignment,
  adminSyncAssignmentWorkspaceRecord,
  adminDeleteAssignment,
  createConversation: createCommunicationConversation,
  createCommunicationUploadUrl,
  sendDirectMessage: sendPortalDirectMessage,
  publishAnnouncement: publishPortalAnnouncement,
  markAnnouncementRead: markPortalAnnouncementRead,
  openCommunicationAttachment,
  deleteAnnouncement: deletePortalAnnouncement,
  saveProfileCustomization,
  createProfileMediaUploadUrl,
  recordProfileMediaUpload,
  removeProfileMedia,
};

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    const db = database();
    const action = String(req.query?.action || "loadOperationsV2");
    if (action === "loadOperationsV2") return send(res, 200, await loadOperationsV2(db, user));
    if (action === "loadCommunications") return send(res, 200, await loadCommunications(db, user));
    const fn = actions[action];
    if (!fn) return send(res, 404, { error: "Unknown operations v2 action." });
    const result = await fn(db, user, readBody(req));
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS operations v2 API error", error);
    return send(res, 500, { error: error.message || "MLS operations request failed." });
  }
}
