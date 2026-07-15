import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import { createMLSApi } from "./api";

export default function useOperationsV2({ enabled = true } = {}) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    load();
  }, [load]);

  useEffect(() => {
    if (!enabled) return undefined;
    const refresh = () => load(true);
    window.addEventListener("mls:assignment-created", refresh);
    return () => window.removeEventListener("mls:assignment-created", refresh);
  }, [enabled, load]);

  const run = useCallback(async (action, payload, successText) => {
    setSaving(true);
    setError("");
    try {
      const result = await api.operationsV2(action, "POST", payload);
      if (successText) {
        setMessage(successText);
        window.setTimeout(() => setMessage(""), 4500);
      }
      await load(true);
      return result;
    } catch (actionError) {
      const text = actionError instanceof Error ? actionError.message : String(actionError);
      setError(text);
      throw actionError;
    } finally {
      setSaving(false);
    }
  }, [api, load]);

  const cancelDocumentRequest = useCallback(async (requestId) => {
    setSaving(true);
    setError("");
    try {
      const result = await api.documentRequestCancel("cancel", "POST", { requestId });
      setMessage("Document request cancelled.");
      window.setTimeout(() => setMessage(""), 4500);
      return result;
    } catch (actionError) {
      const text = actionError instanceof Error ? actionError.message : String(actionError);
      setError(text);
      throw actionError;
    } finally {
      setSaving(false);
    }
  }, [api]);

  const uploadAgreementFile = useCallback(async ({ assignmentId, clientId, kind, file }) => {
    if (!assignmentId || !clientId || !file) throw new Error("Choose an assignment and file first.");
    setSaving(true);
    setError("");
    try {
      const documentType = `${kind}_${assignmentId}`;
      const signed = await api.core("createUploadUrl", "POST", {
        audienceType: "client",
        ownerId: clientId,
        documentType,
        fileName: file.name,
        fileSize: file.size,
      });
      const upload = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (upload.error) throw upload.error;
      const recorded = await api.core("recordUpload", "POST", {
        audienceType: "client",
        ownerId: clientId,
        documentType,
        fileName: file.name,
        storagePath: signed.path,
      });
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
      const signed = await api.operationsV2("createProfileMediaUploadUrl", "POST", {
        profileType,
        ownerId: ownerId || null,
        mediaType,
        fileName: file.name,
        fileSize: file.size,
      });
      const upload = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (upload.error) throw upload.error;
      const recorded = await api.operationsV2("recordProfileMediaUpload", "POST", {
        profileType,
        ownerId: ownerId || null,
        mediaType,
        storagePath: signed.path,
      });
      setMessage(`${mediaType === "avatar" ? "Profile picture" : "Banner"} updated.`);
      window.setTimeout(() => setMessage(""), 4500);
      await load(true);
      return recorded.customization;
    } catch (uploadError) {
      const text = uploadError instanceof Error ? uploadError.message : String(uploadError);
      setError(text);
      throw uploadError;
    } finally {
      setSaving(false);
    }
  }, [api, load, storage]);

  const openAgreementDocument = useCallback(async ({ clientId, documentId }) => {
    if (!clientId || !documentId) return;
    setError("");
    try {
      const result = await api.core("createDocumentOpenLink", "POST", {
        audienceType: "client",
        ownerId: clientId,
        documentId,
      });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (openError) {
      const text = openError instanceof Error ? openError.message : String(openError);
      setError(text);
      throw openError;
    }
  }, [api]);

  const actions = useMemo(() => ({
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
  }), [cancelDocumentRequest, openAgreementDocument, run, uploadAgreementFile, uploadProfileMedia]);

  return {
    data,
    loading,
    saving,
    message,
    error,
    setMessage,
    setError,
    load,
    actions,
  };
}
