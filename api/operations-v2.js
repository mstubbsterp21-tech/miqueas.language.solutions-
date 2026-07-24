import { database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import { loadOperationsV2 } from "./_shared/ops-v2-load.js";
import { adminCreateQuote, adminSendQuote, clientRespondQuote } from "./_shared/ops-v2-quotes.js";
import { adminLinkFoundInvoice } from "./_shared/ops-v2-found-invoices.js";
import { adminLinkFoundContractorPayment } from "./_shared/ops-v2-found-contractors.js";
import { interpreterSubmitInvoice, adminReviewContractorInvoice, openContractorInvoice } from "./_shared/ops-v2-contractor-invoices.js";
import { interpreterSubmitTime, adminReviewTime } from "./_shared/ops-v2-time.js";
import { interpreterSubmitExpense, adminReviewExpense } from "./_shared/ops-v2-expenses.js";
import { interpreterSaveAvailability, interpreterSaveWeeklyAvailability, interpreterDeleteAvailability } from "./_shared/ops-v2-availability.js";
import { adminSaveCredential, adminUpdateOnboarding } from "./_shared/ops-v2-compliance.js";
import { adminLinkBoldSignAgreement } from "./_shared/ops-v2-boldsign.js";
import { adminUpdateFullAssignment, adminSyncAssignmentWorkspaceRecord, adminDeleteAssignment } from "./_shared/ops-v2-assignments.js";
import { adminAssignInterpreterWithNotifications, adminRemoveInterpreterWithNotifications } from "./_shared/ops-v2-assignment-team.js";
import { saveInterpreterProfileDetails, adminUpdateInterpreterProfileDetails } from "./_shared/ops-v2-interpreter-profile.js";
import { adminUpdateInterpreterRates } from "./_shared/ops-v2-rates.js";
import { createRequestAssignment } from "./_shared/ops-v2-request-form.js";
import { portalDeviceStatus, beginPortalDeviceVerification, verifyPortalDevice, interpreterNetworkPrefill } from "./_shared/ops-v2-security-prefill.js";
import { savePortalLayoutV2 } from "./_shared/ops-v2-layout.js";
import {
  createCommunicationConversation,
  createCommunicationUploadUrl,
  publishPortalAnnouncement,
  markPortalAnnouncementRead,
  markPortalConversationRead,
  openCommunicationAttachment,
  deletePortalAnnouncement,
} from "./_shared/ops-v2-communications.js";
import {
  loadCommunicationsWithMentions,
  renamePortalConversation,
  sendPortalMessageWithMentions,
  clearPortalConversation,
  restoreClearedPortalConversation,
  deletePortalConversation,
  restoreDeletedPortalConversation,
  deletePortalDirectMessage,
  restorePortalDirectMessage,
} from "./_shared/ops-v2-conversation-features.js";
import {
  saveProfileCustomization,
  createProfileMediaUploadUrl,
  recordProfileMediaUpload,
  removeProfileMedia,
} from "./_shared/ops-v2-profiles.js";

async function createAuthorizedCommunicationUpload(db, user, payload) {
  if (payload?.context === "announcement" && !user.isAdmin) {
    return { status: 403, payload: { error: "Admin access is required to upload announcement attachments." } };
  }
  return createCommunicationUploadUrl(db, user, payload);
}

const actions = {
  adminCreateQuote,
  adminSendQuote,
  clientRespondQuote,
  adminLinkFoundInvoice,
  adminLinkFoundContractorPayment,
  interpreterSubmitInvoice,
  adminReviewContractorInvoice,
  openContractorInvoice,
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
  adminAssignInterpreter: adminAssignInterpreterWithNotifications,
  adminRemoveInterpreter: adminRemoveInterpreterWithNotifications,
  saveInterpreterProfileDetails,
  adminUpdateInterpreterProfileDetails,
  adminUpdateInterpreterRates,
  createRequestAssignment,
  interpreterNetworkPrefill,
  savePortalLayoutV2,
  createConversation: createCommunicationConversation,
  renameConversation: renamePortalConversation,
  createCommunicationUploadUrl: createAuthorizedCommunicationUpload,
  createUploadUrl: createAuthorizedCommunicationUpload,
  sendDirectMessage: sendPortalMessageWithMentions,
  clearConversation: clearPortalConversation,
  restoreClearedConversation: restoreClearedPortalConversation,
  deleteConversation: deletePortalConversation,
  restoreDeletedConversation: restoreDeletedPortalConversation,
  deleteDirectMessage: deletePortalDirectMessage,
  restoreDirectMessage: restorePortalDirectMessage,
  publishAnnouncement: publishPortalAnnouncement,
  markAnnouncementRead: markPortalAnnouncementRead,
  markConversationRead: markPortalConversationRead,
  openCommunicationAttachment,
  openAttachment: openCommunicationAttachment,
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
    if (action === "deviceStatus") {
      const result = await portalDeviceStatus(db, user, req);
      return send(res, result.status, result.payload);
    }
    if (action === "beginDeviceVerification") {
      const result = await beginPortalDeviceVerification(db, user, req, res, readBody(req));
      return send(res, result.status, result.payload);
    }
    if (action === "verifyDevice") {
      const result = await verifyPortalDevice(db, user, req, res, readBody(req));
      return send(res, result.status, result.payload);
    }
    if (action === "loadOperationsV2") return send(res, 200, await loadOperationsV2(db, user));
    if (action === "loadCommunications") return send(res, 200, await loadCommunicationsWithMentions(db, user));
    const fn = actions[action];
    if (!fn) return send(res, 404, { error: "Unknown operations v2 action." });
    const result = await fn(db, user, readBody(req));
    return send(res, result.status, result.payload);
  } catch (error) {
    console.error("MLS operations v2 API error", error);
    return send(res, 500, { error: error.message || "MLS operations request failed." });
  }
}
