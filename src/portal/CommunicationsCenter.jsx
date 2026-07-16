import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { AlertCircle, Bell, FileText, Loader2, Megaphone, MessageSquare, Paperclip, Plus, Send, Trash2, Users, X } from "lucide-react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import { Badge, Card, EmptyState, Hero, INPUT, SectionHeader, cx, formatDate, pretty } from "./ui";

const EMPTY_ANNOUNCEMENT = { title: "", body: "", audiences: ["interpreter"], expiresAt: "" };
const audienceOptions = [
  ["interpreter", "Interpreters"],
  ["client", "Clients"],
  ["admin", "Other admins"],
];

function Button({ children, onClick, tone = "primary", type = "button", disabled = false, icon: Icon }) {
  const styles = {
    primary: "bg-[#721100] text-white",
    gold: "bg-[#dd7d00] text-white",
    soft: "border border-slate-200 bg-white text-[#721100]",
    danger: "bg-rose-50 text-rose-700",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={cx("inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50", styles[tone])}>{Icon && <Icon size={16} />}{children}</button>;
}

function AttachmentChip({ attachment, openAttachment, removable = false, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
      <FileText size={14} className="shrink-0 text-[#721100]" />
      <button type="button" onClick={() => openAttachment?.(attachment)} className="truncate hover:text-[#721100]">{attachment.file_name || attachment.fileName}</button>
      {removable && <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600"><X size={13} /></button>}
    </span>
  );
}

function UploadPicker({ files, setFiles, disabled = false }) {
  const inputRef = useRef(null);
  function addFiles(event) {
    const selected = [...(event.target.files || [])].slice(0, Math.max(0, 3 - files.length));
    setFiles([...files, ...selected].slice(0, 3));
    event.target.value = "";
  }
  return (
    <div>
      <input ref={inputRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp" onChange={addFiles} />
      <button type="button" disabled={disabled || files.length >= 3} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#721100] disabled:opacity-50"><Paperclip size={14} />Add attachment</button>
      {files.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{files.map((file, index) => <AttachmentChip key={`${file.name}-${index}`} attachment={{ fileName: file.name }} removable onRemove={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))} />)}</div>}
      <p className="mt-2 text-[11px] text-slate-400">Up to 3 files, 10 MB each.</p>
    </div>
  );
}

export default function CommunicationsCenter({ workspace, onRefresh }) {
  const { session } = useSession();
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("messages");
  const [selectedConversationId, setSelectedConversationId] = useState(() => new URLSearchParams(window.location.search).get("conversation") || "");
  const [contactId, setContactId] = useState("");
  const [message, setMessage] = useState("");
  const [messageFiles, setMessageFiles] = useState([]);
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [announcementFiles, setAnnouncementFiles] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function request(action, method = "GET", payload) {
    const bearer = await session?.getToken();
    if (!bearer) throw new Error("Sign in is required.");
    const response = await fetch(`/api/communications?action=${encodeURIComponent(action)}`, {
      method,
      headers: { Authorization: `Bearer ${bearer}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Communications request failed (${response.status}).`);
    return result;
  }

  async function load(quiet = false) {
    if (!session) return;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const result = await request("loadCommunications");
      setData(result);
      const requested = new URLSearchParams(window.location.search).get("conversation");
      const nextConversation = requested || selectedConversationId || result.conversations?.[0]?.id || "";
      setSelectedConversationId(nextConversation);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [session]);

  const conversations = data?.conversations || [];
  const contacts = data?.contacts || [];
  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;
  const conversationMessages = (data?.messages || []).filter((item) => item.conversation_id === selectedConversationId);
  const availableContacts = contacts.filter((contact) => !conversations.some((conversation) => conversation.participant?.otherId === contact.clerkUserId));

  function selectConversation(id) {
    setSelectedConversationId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("section", "communications");
    url.searchParams.set("conversation", id);
    window.history.replaceState({}, "", url);
  }

  async function startConversation() {
    if (!contactId) return;
    setSaving(true);
    setError("");
    try {
      const result = await request("createConversation", "POST", { recipientClerkUserId: contactId });
      setContactId("");
      await load(true);
      selectConversation(result.conversation.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(files, context) {
    const uploaded = [];
    for (const file of files) {
      const signed = await request("createUploadUrl", "POST", { context, fileName: file.name, fileSize: file.size, mimeType: file.type });
      const result = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (result.error) throw result.error;
      uploaded.push({ storagePath: signed.path, fileName: file.name, fileSize: file.size, mimeType: file.type || "application/octet-stream" });
    }
    return uploaded;
  }

  async function sendDirectMessage(event) {
    event.preventDefault();
    if (!selectedConversationId || (!message.trim() && !messageFiles.length)) return;
    setSaving(true);
    setError("");
    try {
      const attachments = await uploadFiles(messageFiles, "message");
      await request("sendDirectMessage", "POST", { conversationId: selectedConversationId, message, attachments });
      setMessage("");
      setMessageFiles([]);
      setNotice("Message sent.");
      await load(true);
      await onRefresh?.();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  function toggleAudience(value) {
    setAnnouncement((current) => ({ ...current, audiences: current.audiences.includes(value) ? current.audiences.filter((item) => item !== value) : [...current.audiences, value] }));
  }

  async function publishAnnouncement(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const attachments = await uploadFiles(announcementFiles, "announcement");
      await request("publishAnnouncement", "POST", { ...announcement, attachments });
      setAnnouncement(EMPTY_ANNOUNCEMENT);
      setAnnouncementFiles([]);
      setShowComposer(false);
      setTab("announcements");
      setNotice("Announcement published and emailed through Google Workspace.");
      await load(true);
      await onRefresh?.();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  async function openAttachment(attachment) {
    try {
      const result = await request("openAttachment", "POST", { attachmentId: attachment.id });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    }
  }

  async function readAnnouncement(item) {
    if (!item.read_at) {
      await request("markAnnouncementRead", "POST", { announcementId: item.id }).catch(() => null);
      await load(true);
      await onRefresh?.();
    }
  }

  async function deleteAnnouncement(item) {
    if (!window.confirm(`Delete the announcement “${item.title}”?`)) return;
    setSaving(true);
    try {
      await request("deleteAnnouncement", "POST", { announcementId: item.id });
      setNotice("Announcement deleted.");
      await load(true);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-[#721100]" size={30} /></div></Card>;

  return (
    <div className="space-y-6">
      <Hero title="Communications" text="Direct messages and announcements stay inside MLS Portal while Google Workspace keeps the email record." actions={data?.role === "admin" ? <Button tone="gold" icon={Megaphone} onClick={() => { setShowComposer(true); setTab("announcements"); }}>New announcement</Button> : null} />
      {error && <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{notice}</div>}

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setTab("messages")} className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black", tab === "messages" ? "bg-[#721100] text-white" : "text-slate-500")}><MessageSquare size={16} />Messages</button>
        <button type="button" onClick={() => setTab("announcements")} className={cx("relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black", tab === "announcements" ? "bg-[#721100] text-white" : "text-slate-500")}><Megaphone size={16} />Announcements{data?.unreadAnnouncements > 0 && <span className="rounded-full bg-[#dd7d00] px-2 py-0.5 text-[10px] text-white">{data.unreadAnnouncements}</span>}</button>
      </div>

      {tab === "messages" ? (
        <Card className="overflow-hidden p-0 md:p-0">
          <div className="grid min-h-[650px] lg:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
              <SectionHeader title="Direct messages" text={data?.role === "admin" ? "Message clients, interpreters, or other admins." : "Message MLS admins directly."} />
              <div className="mt-4 flex gap-2">
                <select value={contactId} onChange={(event) => setContactId(event.target.value)} className={cx(INPUT, "min-w-0 flex-1")}><option value="">New conversation…</option>{availableContacts.map((contact) => <option key={contact.clerkUserId} value={contact.clerkUserId}>{contact.name} · {pretty(contact.role)}</option>)}</select>
                <button type="button" disabled={!contactId || saving} onClick={startConversation} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100] text-white disabled:opacity-40"><Plus size={18} /></button>
              </div>
              <div className="mt-5 max-h-[500px] space-y-2 overflow-y-auto">
                {conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => selectConversation(conversation.id)} className={cx("w-full rounded-2xl p-4 text-left transition", selectedConversationId === conversation.id ? "bg-[#721100] text-white shadow-lg" : "bg-white text-slate-800 hover:shadow")}><div className="flex items-center gap-3"><span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black", selectedConversationId === conversation.id ? "bg-white/10 text-white" : "bg-[#721100]/10 text-[#721100]")}>{(conversation.participant?.otherName || "M")[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{conversation.participant?.otherName || "MLS"}</span><span className={cx("mt-1 block truncate text-xs", selectedConversationId === conversation.id ? "text-white/60" : "text-slate-400")}>{pretty(conversation.participant?.otherRole)}</span></span></div></button>)}
                {!conversations.length && <EmptyState icon={Users} title="No conversations" text="Choose a contact above to begin." />}
              </div>
            </aside>
            <section className="flex min-w-0 flex-col">
              {selectedConversation ? <>
                <header className="border-b border-slate-200 bg-white p-5"><p className="font-black text-slate-950">{selectedConversation.participant?.otherName}</p><p className="mt-1 text-xs text-slate-500">{pretty(selectedConversation.participant?.otherRole)} · Private MLS conversation</p></header>
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#faf8f6] p-5">
                  {conversationMessages.map((item) => {
                    const mine = item.sender_clerk_user_id === workspace.user?.id;
                    return <div key={item.id} className={cx("flex", mine ? "justify-end" : "justify-start")}><div className={cx("max-w-[86%] rounded-[1.35rem] px-4 py-3 text-sm shadow-sm", mine ? "rounded-br-md bg-[#721100] text-white" : "rounded-bl-md bg-white text-slate-700")}><p className="whitespace-pre-wrap leading-6">{item.body}</p>{item.attachments?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.attachments.map((attachment) => <AttachmentChip key={attachment.id} attachment={attachment} openAttachment={openAttachment} />)}</div>}<p className={cx("mt-2 text-[10px]", mine ? "text-white/55" : "text-slate-400")}>{pretty(item.sender_role)} · {formatDate(item.created_at)}</p></div></div>;
                  })}
                  {!conversationMessages.length && <EmptyState icon={MessageSquare} title="Start the conversation" text="Messages are private to the people in this thread." />}
                </div>
                <form onSubmit={sendDirectMessage} className="border-t border-slate-200 bg-white p-4"><UploadPicker files={messageFiles} setFiles={setMessageFiles} disabled={saving} /><div className="mt-3 flex gap-3"><textarea value={message} onChange={(event) => setMessage(event.target.value)} className={cx(INPUT, "min-h-16 flex-1 resize-none")} placeholder="Write a direct message" /><button type="submit" disabled={saving || (!message.trim() && !messageFiles.length)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100] text-white disabled:opacity-40">{saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button></div></form>
              </> : <div className="flex flex-1 items-center justify-center p-8"><EmptyState icon={MessageSquare} title="Choose a conversation" text="Select a thread or start a new one." /></div>}
            </section>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {data?.role === "admin" && showComposer && <Card><div className="flex items-start justify-between gap-4"><SectionHeader title="Publish announcement" text="The announcement appears in the portal and is emailed through Google Workspace." /><button type="button" onClick={() => setShowComposer(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><form onSubmit={publishAnnouncement} className="mt-6 grid gap-4"><label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Title<input className={cx(INPUT, "mt-2 normal-case tracking-normal")} required value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })} /></label><label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Message<textarea className={cx(INPUT, "mt-2 min-h-36 normal-case tracking-normal")} required value={announcement.body} onChange={(event) => setAnnouncement({ ...announcement, body: event.target.value })} /></label><div><p className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Audience</p><div className="mt-2 flex flex-wrap gap-2">{audienceOptions.map(([value, label]) => <button key={value} type="button" onClick={() => toggleAudience(value)} className={cx("rounded-xl border px-3 py-2 text-xs font-black", announcement.audiences.includes(value) ? "border-[#721100] bg-[#721100] text-white" : "border-slate-200 bg-white text-slate-600")}>{label}</button>)}</div></div><label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Expires <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span><input type="datetime-local" className={cx(INPUT, "mt-2 normal-case tracking-normal")} value={announcement.expiresAt} onChange={(event) => setAnnouncement({ ...announcement, expiresAt: event.target.value })} /></label><UploadPicker files={announcementFiles} setFiles={setAnnouncementFiles} disabled={saving} /><div className="flex justify-end"><Button type="submit" tone="gold" icon={Megaphone} disabled={saving || !announcement.title.trim() || !announcement.body.trim() || !announcement.audiences.length}>{saving ? "Publishing…" : "Publish announcement"}</Button></div></form></Card>}
          {data?.role === "admin" && !showComposer && <div className="flex justify-end"><Button tone="gold" icon={Plus} onClick={() => setShowComposer(true)}>New announcement</Button></div>}
          {(data?.announcements || []).map((item) => <Card key={item.id} className={cx(!item.read_at && data?.role !== "admin" ? "border-[#dd7d00]/40 bg-[#fffaf2]" : "")}><button type="button" onClick={() => readAnnouncement(item)} className="w-full text-left"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><Megaphone size={18} className="text-[#dd7d00]" /><h3 className="text-lg font-black text-slate-950">{item.title}</h3>{!item.read_at && data?.role !== "admin" && <span className="h-2.5 w-2.5 rounded-full bg-[#dd7d00]" />}</div><p className="mt-2 text-xs font-bold text-slate-400">{formatDate(item.published_at)} · {(item.audiences || []).map(pretty).join(", ")}</p></div><div className="flex items-center gap-2"><Badge value={item.email_status} />{data?.role === "admin" && <button type="button" onClick={(event) => { event.stopPropagation(); deleteAnnouncement(item); }} className="rounded-xl bg-rose-50 p-2 text-rose-700"><Trash2 size={16} /></button>}</div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.body}</p></button>{item.attachments?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.attachments.map((attachment) => <AttachmentChip key={attachment.id} attachment={attachment} openAttachment={openAttachment} />)}</div>}</Card>)}
          {!(data?.announcements || []).length && <EmptyState icon={Bell} title="No announcements" text={data?.role === "admin" ? "Publish an announcement when MLS has an important update." : "MLS announcements will appear here."} />}
        </div>
      )}
    </div>
  );
}
