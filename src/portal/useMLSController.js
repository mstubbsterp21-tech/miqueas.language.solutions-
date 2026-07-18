import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import { createMLSApi } from "./api";
import {
  EMPTY_ASSIGNMENT, EMPTY_CLIENT, EMPTY_INTERPRETER,
} from "./forms";
import { getPortalTimeZone, setActivePortalTimeZone, zonedDateTimeToUtc } from "./timezones";

export const EMPTY_FEEDBACK = { assignmentId: "", rating: 5, comments: "", followUpRequested: false };
export const EMPTY_INVITE = { role: "client", email: "", organizationName: "" };
export const EMPTY_DOCUMENT_REQUEST = { audienceType: "client", ownerId: "", documentType: "service_agreement", title: "", instructions: "", dueDate: "" };
export const EMPTY_COURSE = { title: "", description: "", category: "Professional Development", contentUrl: "", durationMinutes: "", isPublished: true, sortOrder: 0 };
export const EMPTY_OPPORTUNITY = { assignmentId: "", closesAt: "", notes: "" };
export const EMPTY_BID = { bidRate: "", message: "" };

export default function useMLSController() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const api = useMemo(() => createMLSApi(session), [session]);

  const [workspace, setWorkspace] = useState(null);
  const [operations, setOperations] = useState(null);
  const [app, setApp] = useState(null);
  const [operationsV2, setOperationsV2] = useState(null);
  const [section, setSectionState] = useState(() => new URLSearchParams(window.location.search).get("section") || "overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTimeZone, setSavingTimeZone] = useState(false);
  const [busyDoc, setBusyDoc] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [modal, setModal] = useState("");
  const [profileType, setProfileType] = useState("");
  const [profileRecord, setProfileRecord] = useState(null);
  const [clientDraft, setClientDraft] = useState(EMPTY_CLIENT);
  const [interpreterDraft, setInterpreterDraft] = useState(EMPTY_INTERPRETER);
  const [assignmentDraft, setAssignmentDraft] = useState(EMPTY_ASSIGNMENT);
  const [feedbackDraft, setFeedbackDraft] = useState(EMPTY_FEEDBACK);
  const [inviteDraft, setInviteDraft] = useState(EMPTY_INVITE);
  const [documentRequestDraft, setDocumentRequestDraft] = useState(EMPTY_DOCUMENT_REQUEST);
  const [courseDraft, setCourseDraft] = useState(EMPTY_COURSE);
  const [opportunityDraft, setOpportunityDraft] = useState(EMPTY_OPPORTUNITY);
  const [bidDraft, setBidDraft] = useState(EMPTY_BID);
  const [bidOpportunity, setBidOpportunity] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountRecordId, setAccountRecordId] = useState("");

  const role = workspace?.user?.isAdmin ? "admin" : app?.role || (workspace?.client ? "client" : "interpreter");
  const allAssignments = app?.assignments || workspace?.admin?.assignments || workspace?.client?.assignments || [];
  const selectedAssignment = allAssignments.find((item) => item.id === selectedAssignmentId) || null;
  const accountRecord = accountType === "client"
    ? workspace?.admin?.clients?.find((item) => item.id === accountRecordId) || null
    : workspace?.admin?.interpreters?.find((item) => item.id === accountRecordId) || null;

  function flash(text) {
    setMessage(text);
    setError("");
    window.setTimeout(() => setMessage(""), 4500);
  }

  function fail(value) {
    setError(value instanceof Error ? value.message : String(value));
    setMessage("");
  }

  async function runAssignmentAutomation(action, payload) {
    try {
      return await api.automations(action, "POST", payload);
    } catch (automationError) {
      console.warn(`MLS assignment automation ${action} failed`, automationError);
      return { error: automationError instanceof Error ? automationError.message : String(automationError) };
    }
  }

  function setSection(next) {
    setSectionState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("section", next);
    window.history.replaceState({}, "", url);
    window.localStorage.setItem(`mls-app-section-${role}`, next);
  }

  async function load(quiet = false) {
    if (!session) return;
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const bootstrap = await api.bootstrap();
      const { workspace: workspaceData, operations: operationsData, app: appData } = bootstrap;
      setActivePortalTimeZone(workspaceData.preferences?.timeZone || getPortalTimeZone());
      setWorkspace(workspaceData);
      setOperations(operationsData);
      setApp(appData);
      setOperationsV2(bootstrap.operationsV2 || null);
      if (workspaceData.client?.profile) setClientDraft({ ...EMPTY_CLIENT, ...workspaceData.client.profile });
      if (workspaceData.interpreter?.profile) setInterpreterDraft({ ...EMPTY_INTERPRETER, ...workspaceData.interpreter.profile });

      const nextRole = workspaceData.user?.isAdmin ? "admin" : appData.role || (workspaceData.client ? "client" : "interpreter");
      const requested = new URLSearchParams(window.location.search).get("section");
      if (!requested || requested === "overview") {
        setSectionState(window.localStorage.getItem(`mls-app-section-${nextRole}`) || "overview");
      }
      if (!workspaceData.user?.isAdmin && nextRole === "client" && workspaceData.client?.profile && !workspaceData.client.profile.onboarding_complete) {
        setProfileType("client");
        setProfileRecord(workspaceData.client.profile);
        setModal("profile");
      }
    } catch (loadError) {
      fail(loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isLoaded && user && session) load();
  }, [isLoaded, user?.id, session]);

  useEffect(() => {
    document.title = role === "admin" ? "MLS Admin App" : role === "client" ? "MLS Client App" : "MLS Interpreter App";
  }, [role]);

  function openOwnProfile() {
    const type = role === "client" ? "client" : "interpreter";
    const record = type === "client" ? workspace?.client?.profile : workspace?.interpreter?.profile;
    setProfileType(type);
    setProfileRecord(record || null);
    if (type === "client") setClientDraft({ ...EMPTY_CLIENT, ...(record || {}) });
    else setInterpreterDraft({ ...EMPTY_INTERPRETER, ...(record || {}) });
    setModal("profile");
  }

  function editAccount(type, record) {
    setProfileType(type);
    setProfileRecord(record);
    if (type === "client") setClientDraft({ ...EMPTY_CLIENT, ...record });
    else setInterpreterDraft({ ...EMPTY_INTERPRETER, ...record });
    setModal("profile");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (profileType === "client") {
        await api.core("saveClientProfile", "POST", {
          profile: clientDraft,
          ...(role === "admin" && profileRecord?.id ? { clientId: profileRecord.id } : {}),
        });
      } else if (role === "admin" && profileRecord?.id) {
        await api.core("adminUpdateInterpreterProfile", "POST", { interpreterId: profileRecord.id, profile: interpreterDraft });
      } else {
        await api.core("saveInterpreterProfile", "POST", { profile: interpreterDraft });
      }
      setModal("");
      flash("Profile saved.");
      await load(true);
    } catch (saveError) {
      fail(saveError);
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignment(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const assignment = {
        ...assignmentDraft,
        start_at: assignmentDraft.start_at ? zonedDateTimeToUtc(assignmentDraft.start_at, assignmentDraft.timezone || getPortalTimeZone()) : null,
        end_at: assignmentDraft.end_at ? zonedDateTimeToUtc(assignmentDraft.end_at, assignmentDraft.timezone || getPortalTimeZone()) : null,
      };
      const result = await api.core("createAssignment", "POST", { assignment });
      const automation = await runAssignmentAutomation("requestCreated", { assignmentId: result.assignment.id });
      window.dispatchEvent(new CustomEvent("mls:assignment-created", { detail: { assignmentId: result.assignment.id } }));
      setAssignmentDraft(EMPTY_ASSIGNMENT);
      setModal("");
      flash(automation.error
        ? "Interpreter request submitted. Google Workspace sync needs an admin retry."
        : "Interpreter request submitted and synced to MLS Open Assignments.");
      await load(true);
      setSection("assignments");
    } catch (submitError) {
      fail(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.operations("submitFeedback", "POST", feedbackDraft);
      setFeedbackDraft(EMPTY_FEEDBACK);
      setModal("");
      flash("Feedback submitted. Thank you.");
      await load(true);
    } catch (submitError) {
      fail(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function inviteUser(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.core("invitePortalUser", "POST", inviteDraft);
      flash(`Invitation sent to ${inviteDraft.email}.`);
      setInviteDraft(EMPTY_INVITE);
      setModal("");
    } catch (inviteError) {
      fail(inviteError);
    } finally {
      setSaving(false);
    }
  }

  async function createDocumentRequest(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await api.core("adminCreateDocumentRequest", "POST", documentRequestDraft);
      await api.app("notifyDocumentRequest", "POST", { ...documentRequestDraft, requestId: result.request?.id }).catch(() => null);
      setDocumentRequestDraft(EMPTY_DOCUMENT_REQUEST);
      setModal("");
      flash("Document request created.");
      await load(true);
    } catch (requestError) {
      fail(requestError);
    } finally {
      setSaving(false);
    }
  }

  async function saveCourse(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.operations("adminSaveCourse", "POST", courseDraft);
      setCourseDraft(EMPTY_COURSE);
      setModal("");
      flash("Training course saved.");
      await load(true);
    } catch (courseError) {
      fail(courseError);
    } finally {
      setSaving(false);
    }
  }

  async function publishOpportunity(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.operations("adminPublishOpportunity", "POST", {
        ...opportunityDraft,
        closesAt: opportunityDraft.closesAt ? zonedDateTimeToUtc(opportunityDraft.closesAt, getPortalTimeZone()) : null,
      });
      setOpportunityDraft(EMPTY_OPPORTUNITY);
      setModal("");
      flash("Assignment opportunity published.");
      await load(true);
    } catch (opportunityError) {
      fail(opportunityError);
    } finally {
      setSaving(false);
    }
  }

  async function submitBid(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.operations("submitBid", "POST", {
        opportunityId: bidOpportunity.id,
        bidRate: bidDraft.bidRate || null,
        message: bidDraft.message || null,
      });
      setModal("");
      setBidOpportunity(null);
      setBidDraft(EMPTY_BID);
      flash("Bid submitted to MLS.");
      await load(true);
    } catch (bidError) {
      fail(bidError);
    } finally {
      setSaving(false);
    }
  }

  async function progressCourse(course, percent) {
    try {
      await api.operations("updateTraining", "POST", { courseId: course.id, progressPercent: percent });
      flash(percent === 100 ? "Course marked complete." : "Course progress reset.");
      await load(true);
    } catch (trainingError) {
      fail(trainingError);
    }
  }

  async function uploadDocument(type, file, replaceDocumentId = null) {
    if (!file) return;
    const audienceType = role === "client" ? "client" : "interpreter";
    const owner = audienceType === "client" ? workspace?.client?.profile : workspace?.interpreter?.profile;
    if (!owner?.id) return fail(`Save your ${audienceType} profile before uploading documents.`);
    setBusyDoc(type);
    try {
      const signed = await api.core("createUploadUrl", "POST", {
        audienceType, ownerId: owner.id, documentType: type, fileName: file.name, fileSize: file.size,
      });
      const result = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (result.error) throw result.error;
      await api.core("recordUpload", "POST", {
        audienceType, ownerId: owner.id, documentType: type, fileName: file.name,
        storagePath: signed.path, replaceDocumentId,
      });
      flash(replaceDocumentId ? "Document replaced." : "Document uploaded.");
      await load(true);
    } catch (uploadError) {
      fail(uploadError);
    } finally {
      setBusyDoc("");
    }
  }

  async function openDocument(document) {
    const audienceType = role === "client" ? "client" : "interpreter";
    const ownerId = audienceType === "client" ? workspace?.client?.profile?.id : workspace?.interpreter?.profile?.id;
    try {
      const result = await api.core("createDocumentOpenLink", "POST", { audienceType, ownerId, documentId: document.id });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (documentError) {
      fail(documentError);
    }
  }

  async function removeDocument(document) {
    if (!window.confirm(`Delete ${document.file_name}?`)) return;
    const audienceType = role === "client" ? "client" : "interpreter";
    const ownerId = audienceType === "client" ? workspace?.client?.profile?.id : workspace?.interpreter?.profile?.id;
    try {
      await api.core("deleteDocument", "POST", { audienceType, ownerId, documentId: document.id });
      flash("Document deleted.");
      await load(true);
    } catch (documentError) {
      fail(documentError);
    }
  }

  async function updateAssignment(assignment, patch) {
    try {
      const assignmentChanges = patch.assignment || {
        ...(Object.prototype.hasOwnProperty.call(patch, "status") ? { status: patch.status } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, "paymentStatus") ? { payment_status: patch.paymentStatus } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, "invoiceNumber") ? { invoice_number: patch.invoiceNumber } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, "invoiceAmount") ? { invoice_amount: patch.invoiceAmount === "" ? null : patch.invoiceAmount } : {}),
        ...(Object.prototype.hasOwnProperty.call(patch, "adminNotes") ? { admin_notes: patch.adminNotes } : {}),
      };
      const result = await api.app("adminUpdateAssignment", "POST", { assignmentId: assignment.id, assignment: assignmentChanges });
      let automation = null;
      if (patch.status === "confirmed") {
        automation = await runAssignmentAutomation("confirmed", { assignmentId: result.assignment.id });
      }
      flash(automation?.error ? "Assignment updated. Google Workspace sync needs a retry." : "Assignment updated.");
      await load(true);
    } catch (assignmentError) {
      fail(assignmentError);
    }
  }

  async function syncAssignmentAutomation(assignment) {
    const result = await runAssignmentAutomation("syncAssignment", { assignmentId: assignment.id });
    if (result.error) return fail(result.error);
    flash("Calendar, Drive, and email automation refreshed.");
    await load(true);
  }

  async function assignInterpreter(payload) {
    try {
      await api.app("adminAssignInterpreter", "POST", payload);
      flash("Interpreter assigned.");
      await load(true);
    } catch (assignmentError) {
      fail(assignmentError);
    }
  }

  async function removeInterpreter(linkId) {
    if (!window.confirm("Remove this interpreter from the assignment?")) return;
    try {
      await api.app("adminRemoveInterpreter", "POST", { assignmentInterpreterId: linkId });
      flash("Interpreter removed from assignment.");
      await load(true);
    } catch (assignmentError) {
      fail(assignmentError);
    }
  }

  async function acceptBid(bid) {
    try {
      const result = await api.app("adminAcceptBid", "POST", { bidId: bid.id });
      if (result.assignment?.id) {
        await runAssignmentAutomation("confirmed", { assignmentId: result.assignment.id });
      }
      flash("Bid accepted and assignment confirmed.");
      await load(true);
    } catch (bidError) {
      fail(bidError);
    }
  }

  async function sendMessage(assignmentId, body) {
    try {
      const result = await api.app("sendMessage", "POST", { assignmentId, body });
      if (result.message?.id) {
        await runAssignmentAutomation("messageEmail", { messageId: result.message.id });
      }
      await load(true);
    } catch (messageError) {
      fail(messageError);
    }
  }

  async function markNotificationRead(notificationId) {
    try {
      await api.app("markNotificationRead", "POST", notificationId ? { notificationId } : {});
      await load(true);
    } catch (notificationError) {
      fail(notificationError);
    }
  }

  async function saveTimeZone(timeZone) {
    const previous = workspace?.preferences?.timeZone || getPortalTimeZone();
    setSavingTimeZone(true);
    setActivePortalTimeZone(timeZone);
    setWorkspace((current) => current ? {
      ...current,
      preferences: { ...(current.preferences || {}), timeZone },
    } : current);
    try {
      await api.core("savePortalPreference", "POST", { timeZone });
      flash("Schedule time zone updated.");
      await load(true);
    } catch (timeZoneError) {
      setActivePortalTimeZone(previous);
      setWorkspace((current) => current ? {
        ...current,
        preferences: { ...(current.preferences || {}), timeZone: previous },
      } : current);
      fail(timeZoneError);
    } finally {
      setSavingTimeZone(false);
    }
  }

  function openAssignment(assignment) {
    setSelectedAssignmentId(assignment.id);
    setModal("assignment");
  }

  function openAccount(type, record) {
    setAccountType(type);
    setAccountRecordId(record.id);
    setModal("account");
  }

  function requestAccountDocument(type, record) {
    setDocumentRequestDraft({ ...EMPTY_DOCUMENT_REQUEST, audienceType: type, ownerId: record.id, documentType: type === "client" ? "service_agreement" : "resume" });
    setModal("documentRequest");
  }

  const actions = {
    go: setSection,
    openProfile: openOwnProfile,
    openRequest: () => setModal("request"),
    openFeedback: () => setModal("feedback"),
    openInvite: () => setModal("invite"),
    openDocumentRequest: () => setModal("documentRequest"),
    openCourse: () => setModal("course"),
    openOpportunity: () => setModal("opportunity"),
    openAssignment,
    openClient: (record) => openAccount("client", record),
    openInterpreter: (record) => openAccount("interpreter", record),
    editAccount,
    requestAccountDocument,
    progressCourse,
    submitBid: (opportunity) => { setBidOpportunity(opportunity); setBidDraft(EMPTY_BID); setModal("bid"); },
    acceptBid,
    sendMessage,
    markNotificationRead,
    saveTimeZone,
    updateAssignment,
    syncAssignmentAutomation,
    assignInterpreter,
    removeInterpreter,
    upload: uploadDocument,
    openDocument,
    removeDocument,
  };

  return {
    user, isLoaded, workspace, operations, app, operationsV2, role, section, setSection,
    loading, refreshing, saving, savingTimeZone, busyDoc, message, error, setMessage, setError,
    load, modal, setModal, profileType, clientDraft, setClientDraft,
    interpreterDraft, setInterpreterDraft, assignmentDraft, setAssignmentDraft,
    feedbackDraft, setFeedbackDraft, inviteDraft, setInviteDraft,
    documentRequestDraft, setDocumentRequestDraft, courseDraft, setCourseDraft,
    opportunityDraft, setOpportunityDraft, bidDraft, setBidDraft, bidOpportunity,
    selectedAssignment, accountType, accountRecord, actions,
    saveProfile, submitAssignment, submitFeedback, inviteUser, createDocumentRequest,
    saveCourse, publishOpportunity, submitBid,
  };
}
