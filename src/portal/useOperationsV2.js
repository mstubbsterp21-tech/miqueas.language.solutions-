import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { createMLSApi } from "./api";

export default function useOperationsV2({ enabled = true } = {}) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
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
    deleteAvailability: (availabilityId) => run("interpreterDeleteAvailability", { availabilityId }, "Availability removed."),
    saveCredential: (payload) => run("adminSaveCredential", payload, "Credential record saved."),
    updateOnboarding: (payload) => run("adminUpdateOnboarding", payload, "Onboarding stage updated."),
    linkBoldSignAgreement: (payload) => run("adminLinkBoldSignAgreement", payload, "BoldSign agreement linked."),
  }), [run]);

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
