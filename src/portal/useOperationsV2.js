import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import { createMLSApi } from "./api";

export default function useOperationsV2({ enabled = true, initialData = null, deferInitialLoad = false } = {}) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const flash = useCallback((text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4500);
  }, []);

  const load = useCallback(async (quiet = false) => {
    if (!session || !enabled) return;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const result = await api.operationsV2("loadOperationsV2");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [api, enabled, session]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    if (!deferInitialLoad) load();
  }, [deferInitialLoad, initialData, load]);

  useEffect(() => {
    if (!enabled) return undefined;
    const refresh = () => load(true);
    window.addEventListener("mls:assignment-created", refresh);
    window.addEventListener("mls:assignment-mutated", refresh);
    return () => {
      window.removeEventListener("mls:assignment-created", refresh);
      window.removeEventListener("mls:assignment-mutated", refresh);
    };
  }, [enabled, load]);

  const run = useCallback(async (action, payload, successText) => {
    setSaving(true);
    setError("");
    try {
      const result = await api.operationsV2(action, "POST", payload);
      if (successText) flash(successText);
      await load(true);
      return result;
    } catch (actionError) {
      const text = actionError instanceof Error ? actionError.message : String(actionError);
      setError(text);
      throw actionError;
    } finally {
      setSaving(false);
    }
  }, [api, flash, load]);

  const runAssignment = useCallback(async (work, successText) => {
    setSaving(true);
    setError("");
    try {
      const result = await work();
      flash(typeof successText === "function" ? successText(result) : successText);
      window.dispatchEvent(new CustomEvent("mls:assignment-mutated"));
      await load(true);
      return result;
    } catch (actionError) {
      const text = actionError instanceof Error ? actionError.message : String(actionError);
      setError(text);
      throw actionError;
    } finally {
      setSaving(false);
    }
  }, [flash, load]);

  const createAssignment = useCallback((payload) => runAssignment(async () => {
    const created = await api.core("createAssignment", "POST", payload);
    try {
      const automation = await api.automations("requestCreated", "POST", { assignmentId: created.assignment.id });
      return { ...created, automation };
    } catch (automationError) {
      return { ...created, automation: { error: automationError instanceof Error ? automationError.message : String(automationError) } };
    }
  }, (result) => result.automation?.error
    ? "Assignment created. Google Workspace sync needs a retry."
    : "Assignment created and synced to Google Workspace."), [api, runAssignment]);

  const updateAssignment = useCallback((assignment, patch) => runAssignment(async () => {
    const updated = await api.app("adminUpdateAssignment", "POST", { assignmentId: assignment.id, ...patch });
    try {
      const automation = await api.automations("syncAssignment", "POST", { assignmentId: assignment.id });
      return { ...updated, automation };
    } catch (automationError) {
      return { ...updated, automation: { error: automationError instanceof Error ? automationError.message : String(automationError) } };
    }
  }, (result) => result.automation?.error
    ? "Assignment updated. Google Workspace sync needs a retry."
    : "Assignment updated and synced to Google Workspace."), [api, runAssignment]);

  const deleteAssignment = useCallback((assignment, confirmation = "") => runAssignment(
    () => api.app("adminDeleteAssignment", "POST", { assignmentId: assignment.id, confirmation }),
    "Assignment deleted from MLS Portal and Google Workspace.",
  ), [api, runAssignment]);

  const cancelDocumentRequest = useCallback(async (requestId) => {
    setSaving(true);
    setError("");
    try {
      const result = await api.documentRequestCancel("cancel", "POST", { requestId });
      flash("Document request cancelled.");
      return result;
    } catch (actionError) {
      const text = actionError instanceof Error ? actionError.message : String(actionError);
      setError(text);
      throw actionError;
    } finally {
      setSaving(false);
    }
  }, [api, flash]);

  const uploadAgreementFile = useCallback(async ({ assignmentId, clientId, kind, file }) => {
    if (!assignmentId || !clientId || !file) throw new Error("Choose an assignment and file first.");
    setSaving(true);
    setError("");
    try {
      const documentType = `${kind}_${assignmentId}`;
      const signed = await api.core("createUploadUrl", "POST", { audienceType: "client", ownerId: clientId, documentType, fileName: file.name, fileSize: file.size });
      const upload = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (upload.error) throw upload.error;
      const recorded = await api.core("recordUpload", "POST", { audienceType: "client", ownerId: clientId, documentType, fileName: file.name, storagePath: signed.path });
      return recorded.document;
    } catch (uploadError) {
      const text = uploadError instanceof Error ? uploadError.message : String(uploadError);
      setError(text);
      throw uploadError;
    } finally {
      setSaving(false);
    }
  }, [api, storage]);

  const uploadProfileMedia = useCallback(async ({ profileType, ownerId, mediaType, file }) => {
    if (!profileType || !mediaType || !file) throw new Error("Choose a profile image first.");
    setSaving(true);
    setError("");
    try {
      const signed = await api.operationsV2("createProfileMediaUploadUrl", "POST", { profileType, ownerId: ownerId || null, mediaType, fileName: file.name, fileSize: file.size });
      const upload = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (upload.error) throw upload.error;
      const recorded = await api.operationsV2("recordProfileMediaUpload", "POST", { profileType, ownerId: ownerId || null, mediaType, storagePath: signed.path });
      flash(`${mediaType === "avatar" ? "Profile picture" : "Banner"} updated.`);
      await load(true);
      return recorded.customization;
    } catch (uploadError) {
      const text = uploadError instanceof Error ? uploadError.message : String(uploadError);
      setError(text);
      throw uploadError;
    } finally {
      setSaving(false);
    }
  }, [api, flash, load, storage]);

  const openAgreementDocument = useCallback(async ({ clientId, documentId }) => {
    if (!clientId || !documentId) return;
    setError("");
    try {
      const result = await api.core("createDocumentOpenLink", "POST", { audienceType: "client", ownerId: clientId, documentId });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (openError) {
      const text = openError instanceof Error ? openError.message : String(openError);
      setError(text);
      throw openError;
    }
  }, [api]);

  const actions = useMemo(() => ({
    createAssignment,
    updateAssignment,
    deleteAssignment,
    createQuote: (payload) => run("adminCreateQuote", payload, "Quote saved."),
    sendQuote: (quoteId) => run("adminSendQuote", { quoteId }, "Quote sent to the client."),
    respondQuote: (quoteId, response, note = "") => run("clientRespondQuote", { quoteId, response, note }, response === "approved" ? "Quote approved." : "Quote response sent."),
    linkFoundInvoice: (payload) => run("adminLinkFoundInvoice", payload, "Found invoice linked."),
    linkFoundContractorPayment: (payload) => run("adminLinkFoundContractorPayment", payload, "Found contractor payment linked."),
    submitTime: (payload) => run("interpreterSubmitTime", payload, "Time submitted for review."),
    reviewTime: (timeEntryId, status, notes = "") => run("adminReviewTime", { timeEntryId, status, notes }, `Time entry ${status}.`),
    submitExpense: (payload) => run("interpreterSubmitExpense", payload, "Expense submitted."),
    reviewExpense: (expenseId, status, notes = "") => run("adminReviewExpense", { expenseId, status, notes }, `Expense ${status}.`),
    saveAvailability: (payload) => run("interpreterSaveAvailability", payload, "Availability saved."),
    saveWeeklyAvailability: (payload) => run("interpreterSaveWeeklyAvailability", payload, "Weekly availability saved."),
    deleteAvailability: (availabilityId) => run("interpreterDeleteAvailability", { availabilityId }, "Availability removed."),
    saveCredential: (payload) => run("adminSaveCredential", payload, "Credential record saved."),
    updateOnboarding: (payload) => run("adminUpdateOnboarding", payload, "Onboarding stage updated."),
    linkBoldSignAgreement: (payload) => run("adminLinkBoldSignAgreement", payload, "Manual BoldSign record updated."),
    saveProfileCustomization: (payload) => run("saveProfileCustomization", payload, "Profile design saved."),
    uploadProfileMedia,
    removeProfileMedia: (payload) => run("removeProfileMedia", payload, `${payload.mediaType === "avatar" ? "Profile picture" : "Banner"} removed.`),
    cancelDocumentRequest,
    uploadAgreementFile,
    openAgreementDocument,
  }), [cancelDocumentRequest, createAssignment, deleteAssignment, openAgreementDocument, run, updateAssignment, uploadAgreementFile, uploadProfileMedia]);

  return { data, loading, saving, message, error, setMessage, setError, load, actions };
}
