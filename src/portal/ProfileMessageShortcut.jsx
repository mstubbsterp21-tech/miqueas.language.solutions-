import { useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";

function profileLabel(profileType, profile = {}) {
  if (profileType === "client") {
    return profile.organization_name || profile.primary_contact_name || profile.email || "this client";
  }
  return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "this interpreter";
}

export default function ProfileMessageShortcut({
  profileType,
  profile = {},
  targetClerkUserId = "",
  onNavigate,
  selfService = false,
}) {
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = profileLabel(profileType, profile);
  const unavailable = !selfService && !targetClerkUserId;

  async function request(action, payload) {
    const token = await session?.getToken();
    if (!token) throw new Error("Sign in is required.");
    const response = await fetch(`/api/operations-v2?action=${encodeURIComponent(action)}`, {
      method: payload ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Messaging request failed (${response.status}).`);
    return result;
  }

  async function openThread() {
    if (unavailable) return;
    setBusy(true);
    setError("");
    try {
      let recipientId = targetClerkUserId;
      let conversationId = "";
      const communications = await request("loadCommunications");

      if (selfService) {
        const admin = (communications.contacts || []).find((contact) => contact.role === "admin");
        if (!admin) throw new Error("No MLS admin messaging contact is available yet.");
        recipientId = admin.clerkUserId;
      }

      const existing = (communications.conversations || []).find(
        (conversation) => conversation.participant?.otherId === recipientId,
      );
      if (existing) {
        conversationId = existing.id;
      } else {
        const created = await request("createConversation", { recipientClerkUserId: recipientId });
        conversationId = created.conversation?.id || "";
      }

      const url = new URL(window.location.href);
      url.searchParams.set("section", "communications");
      if (conversationId) url.searchParams.set("conversation", conversationId);
      window.history.replaceState({}, "", url);
      onNavigate?.("communications");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : String(messageError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[#721100]/15 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]">
            <MessageSquare size={20} />
          </span>
          <div>
            <h3 className="font-black text-slate-950">{selfService ? "Message MLS" : `Message ${label}`}</h3>
            {unavailable && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Portal account not active</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={openThread}
          disabled={busy || unavailable}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white transition hover:bg-[#5d0e00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
          {busy ? "Opening…" : selfService ? "Message MLS" : "Send message"}
        </button>
      </div>
      {error && <p className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
    </section>
  );
}
