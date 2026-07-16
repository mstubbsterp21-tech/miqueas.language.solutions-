import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import {
  AlertCircle,
  AtSign,
  Bell,
  Check,
  FileText,
  Loader2,
  Megaphone,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";
import { Badge, Card, EmptyState, Hero, INPUT, SectionHeader, cx, formatDate, pretty } from "./ui";

const EMPTY_ANNOUNCEMENT = { title: "", body: "", audiences: ["interpreter"], expiresAt: "" };
const audienceOptions = [["interpreter", "Interpreters"], ["client", "Clients"], ["admin", "Other admins"]];

function Button({ children, onClick, tone = "primary", type = "button", disabled = false, icon: Icon }) {
  const styles = {
    primary: "bg-[#721100] text-white",
    gold: "bg-[#dd7d00] text-white",
    soft: "border border-slate-200 bg-white text-[#721100]",
    danger: "bg-rose-50 text-rose-700",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        styles[tone],
      )}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function AttachmentChip({ attachment, openAttachment, removable = false, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
      <FileText size={14} className="shrink-0 text-[#721100]" />
      <button type="button" onClick={() => openAttachment?.(attachment)} className="truncate hover:text-[#721100]">
        {attachment.file_name || attachment.fileName}
      </button>
      {removable && (
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-rose-600">
          <X size={13} />
        </button>
      )}
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
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
        onChange={addFiles}
      />
      <button
        type="button"
        disabled={disabled || files.length >= 3}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#721100] disabled:opacity-50"
      >
        <Paperclip size={14} />
        Add attachment
      </button>
      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <AttachmentChip
              key={`${file.name}-${index}`}
              attachment={{ fileName: file.name }}
              removable
              onRemove={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))}
            />
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-slate-400">Up to 3 files, 10 MB each.</p>
    </div>
  );
}

function NewConversationPanel({ role, contacts, saving, close, create }) {
  const [mode, setMode] = useState("direct");
  const [selected, setSelected] = useState([]);
  const [title, setTitle] = useState("");
  const groupsAllowed = role !== "client";
  const filtered = mode === "group" && role === "interpreter"
    ? contacts.filter((item) => item.role !== "client")
    : contacts;

  function toggle(id) {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  return (
    <Card className="mb-4 border-[#dd7d00]/30 bg-[#fffaf2]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">New conversation</h3>
          <p className="mt-1 text-sm text-slate-500">Choose a person or create a focused group chat.</p>
        </div>
        <button type="button" onClick={close} className="rounded-xl p-2 text-slate-400 hover:bg-white">
          <X size={18} />
        </button>
      </div>

      {groupsAllowed && (
        <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => { setMode("direct"); setSelected([]); }}
            className={cx("rounded-lg px-3 py-2 text-xs font-black", mode === "direct" ? "bg-[#721100] text-white" : "text-slate-500")}
          >
            Direct
          </button>
          <button
            type="button"
            onClick={() => { setMode("group"); setSelected([]); }}
            className={cx("rounded-lg px-3 py-2 text-xs font-black", mode === "group" ? "bg-[#721100] text-white" : "text-slate-500")}
          >
            Group
          </button>
        </div>
      )}

      {mode === "group" && (
        <label className="mt-4 block text-sm font-black text-slate-700">
          Group name
          <input
            className={cx(INPUT, "mt-2")}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Assignment team, MLS planning…"
          />
        </label>
      )}

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {filtered.map((contact) => {
          const active = selected.includes(contact.clerkUserId);
          const disabled = mode === "direct" && selected.length > 0 && !active;
          return (
            <button
              key={contact.clerkUserId}
              type="button"
              disabled={disabled}
              onClick={() => mode === "direct" ? setSelected(active ? [] : [contact.clerkUserId]) : toggle(contact.clerkUserId)}
              className={cx(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-35",
                active ? "border-[#dd7d00] bg-white shadow-sm" : "border-slate-200 bg-white/70",
              )}
            >
              <span className={cx(
                "flex h-9 w-9 items-center justify-center rounded-xl font-black",
                active ? "bg-[#721100] text-white" : "bg-slate-100 text-slate-500",
              )}>
                {active ? <Check size={16} /> : (contact.name || "M")[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-800">{contact.name}</span>
                <span className="text-xs text-slate-400">{pretty(contact.role)}</span>
              </span>
            </button>
          );
        })}
        {!filtered.length && <EmptyState icon={Users} title="No contacts available" text="Portal users appear after their accounts are activated." />}
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          icon={mode === "group" ? Users : MessageSquare}
          disabled={saving || !selected.length || (mode === "group" && selected.length < 2)}
          onClick={() => create({ mode, selected, title })}
        >
          {saving ? "Creating…" : mode === "group" ? "Create group" : "Start message"}
        </Button>
      </div>
      {mode === "group" && selected.length < 2 && <p className="mt-2 text-right text-xs text-slate-400">Choose at least two other people.</p>}
    </Card>
  );
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function MessageText({ body, mentions = [], mine = false }) {
  const names = [...new Set(mentions.map((item) => item.mentioned_display_name).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!names.length) return <p className="whitespace-pre-wrap leading-6">{body}</p>;

  const expression = new RegExp(`(@(?:${names.map(escapeRegex).join("|")}))`, "gi");
  const mentionTokens = new Set(names.map((name) => `@${name}`.toLowerCase()));
  return (
    <p className="whitespace-pre-wrap leading-6">
      {String(body || "").split(expression).map((part, index) => mentionTokens.has(part.toLowerCase())
        ? (
          <span
            key={`${part}-${index}`}
            className={cx(
              "rounded-md px-1 py-0.5 font-black",
              mine ? "bg-white/15 text-white" : "bg-[#fff0d4] text-[#721100]",
            )}
          >
            {part}
          </span>
        )
        : <span key={`${index}-${part.slice(0, 8)}`}>{part}</span>)}
    </p>
  );
}

function MentionComposer({ value, onChange, members, currentUserId, mentionIds, setMentionIds, disabled }) {
  const textareaRef = useRef(null);
  const [context, setContext] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const eligibleMembers = useMemo(
    () => (members || []).filter((item) => item.clerk_user_id !== currentUserId && item.display_name),
    [members, currentUserId],
  );

  const suggestions = useMemo(() => {
    if (!context) return [];
    const query = context.query.toLowerCase();
    return eligibleMembers
      .filter((item) => !query || item.display_name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [context, eligibleMembers]);

  useEffect(() => {
    setActiveIndex(0);
  }, [context?.query]);

  function updateMentionContext(nextValue, caret) {
    const beforeCaret = nextValue.slice(0, caret);
    const mentionStart = beforeCaret.lastIndexOf("@");
    if (mentionStart < 0 || (mentionStart > 0 && !/\s/.test(beforeCaret[mentionStart - 1]))) {
      setContext(null);
      return;
    }
    const query = beforeCaret.slice(mentionStart + 1);
    if (query.length > 60 || query.includes("\n") || /[,;:!?()[\]{}]/.test(query)) {
      setContext(null);
      return;
    }
    setContext({ start: mentionStart, end: caret, query });
  }

  function handleChange(event) {
    const nextValue = event.target.value;
    const caret = event.target.selectionStart ?? nextValue.length;
    onChange(nextValue);
    setMentionIds((current) => current.filter((id) => {
      const member = eligibleMembers.find((item) => item.clerk_user_id === id);
      return member && nextValue.toLowerCase().includes(`@${member.display_name}`.toLowerCase());
    }));
    updateMentionContext(nextValue, caret);
  }

  function chooseMention(member) {
    if (!context) return;
    const token = `@${member.display_name} `;
    const nextValue = `${value.slice(0, context.start)}${token}${value.slice(context.end)}`;
    const nextCaret = context.start + token.length;
    onChange(nextValue);
    setMentionIds((current) => current.includes(member.clerk_user_id) ? current : [...current, member.clerk_user_id]);
    setContext(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleKeyDown(event) {
    if (!context || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      chooseMention(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setContext(null);
    }
  }

  return (
    <div className="relative flex-1">
      {context && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Mention someone
          </div>
          {suggestions.map((member, index) => (
            <button
              key={member.clerk_user_id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseMention(member)}
              className={cx(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                index === activeIndex ? "bg-[#fff6e8]" : "hover:bg-slate-50",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#721100]/10 text-xs font-black text-[#721100]">
                {member.display_name[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-800">{member.display_name}</span>
                <span className="text-xs text-slate-400">{pretty(member.role)}</span>
              </span>
              <AtSign size={14} className="text-[#dd7d00]" />
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => updateMentionContext(value, event.currentTarget.selectionStart ?? value.length)}
        disabled={disabled}
        className={cx(INPUT, "min-h-16 w-full resize-none")}
        placeholder="Write a message. Type @ to mention someone."
      />
      {mentionIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {mentionIds.map((id) => {
            const member = eligibleMembers.find((item) => item.clerk_user_id === id);
            return member ? (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-[#fff0d4] px-2.5 py-1 text-[11px] font-black text-[#721100]">
                <AtSign size={11} />
                {member.display_name}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

export default function CommunicationsCenter({ workspace, onRefresh }) {
  const { session } = useSession();
  const storage = useMemo(() => createPortalSupabaseClient(null), []);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("messages");
  const [selectedConversationId, setSelectedConversationId] = useState(
    () => new URLSearchParams(window.location.search).get("conversation") || "",
  );
  const [message, setMessage] = useState("");
  const [mentionIds, setMentionIds] = useState([]);
  const [messageFiles, setMessageFiles] = useState([]);
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [announcementFiles, setAnnouncementFiles] = useState([]);
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [showConversationComposer, setShowConversationComposer] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function request(action, method = "GET", payload) {
    const bearer = await session?.getToken();
    if (!bearer) throw new Error("Sign in is required.");
    const response = await fetch(`/api/communications?action=${encodeURIComponent(action)}`, {
      method,
      headers: {
        Authorization: `Bearer ${bearer}`,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
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
      setSelectedConversationId((current) => requested || current || result.conversations?.[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [session]);
  useEffect(() => {
    const listener = () => load(true);
    window.addEventListener("mls:portal-realtime", listener);
    return () => window.removeEventListener("mls:portal-realtime", listener);
  }, [session]);
  useEffect(() => {
    setMessage("");
    setMentionIds([]);
    setMessageFiles([]);
    setEditingTitle(false);
  }, [selectedConversationId]);

  const conversations = data?.conversations || [];
  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;
  const conversationMessages = (data?.messages || []).filter((item) => item.conversation_id === selectedConversationId);

  function selectConversation(id) {
    setSelectedConversationId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("section", "communications");
    url.searchParams.set("conversation", id);
    window.history.replaceState({}, "", url);
  }

  async function createConversation({ mode, selected, title }) {
    setSaving(true);
    setError("");
    try {
      const result = await request(
        "createConversation",
        "POST",
        mode === "group"
          ? { conversationType: "group", memberClerkUserIds: selected, title }
          : { recipientClerkUserId: selected[0] },
      );
      setShowConversationComposer(false);
      await load(true);
      selectConversation(result.conversation.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  async function renameConversation(nextTitle) {
    if (!selectedConversationId) return;
    setSaving(true);
    setError("");
    try {
      await request("renameConversation", "POST", { conversationId: selectedConversationId, title: nextTitle });
      setEditingTitle(false);
      setNotice(nextTitle.trim() ? "Conversation renamed." : "Conversation name reset.");
      await load(true);
      await onRefresh?.();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(files, context) {
    const uploaded = [];
    for (const file of files) {
      const signed = await request("createUploadUrl", "POST", {
        context,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      const result = await storage.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
      if (result.error) throw result.error;
      uploaded.push({
        storagePath: signed.path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      });
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
      await request("sendDirectMessage", "POST", {
        conversationId: selectedConversationId,
        message,
        mentionClerkUserIds: mentionIds,
        attachments,
      });
      setMessage("");
      setMentionIds([]);
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
    setAnnouncement((current) => ({
      ...current,
      audiences: current.audiences.includes(value)
        ? current.audiences.filter((item) => item !== value)
        : [...current.audiences, value],
    }));
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
      setShowAnnouncementComposer(false);
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

  if (loading) {
    return (
      <Card>
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="animate-spin text-[#721100]" size={30} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Hero
        title="Communications"
        text="Messages and announcements stay inside MLS Portal while Google Workspace keeps the email record."
        actions={data?.role === "admin" ? (
          <Button tone="gold" icon={Megaphone} onClick={() => { setShowAnnouncementComposer(true); setTab("announcements"); }}>
            New announcement
          </Button>
        ) : null}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{notice}</div>}

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("messages")}
          className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black", tab === "messages" ? "bg-[#721100] text-white" : "text-slate-500")}
        >
          <MessageSquare size={16} />
          Messages
        </button>
        <button
          type="button"
          onClick={() => setTab("announcements")}
          className={cx("relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black", tab === "announcements" ? "bg-[#721100] text-white" : "text-slate-500")}
        >
          <Megaphone size={16} />
          Announcements
          {data?.unreadAnnouncements > 0 && <span className="rounded-full bg-[#dd7d00] px-2 py-0.5 text-[10px] text-white">{data.unreadAnnouncements}</span>}
        </button>
      </div>

      {tab === "messages" ? (
        <Card className="overflow-hidden p-0 md:p-0">
          <div className="grid min-h-[650px] lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-3">
                <SectionHeader
                  title="Messages"
                  text={data?.role === "admin"
                    ? "Direct and group conversations."
                    : data?.role === "interpreter"
                      ? "Message MLS or other interpreters."
                      : "Message MLS directly."}
                />
                <button
                  type="button"
                  onClick={() => setShowConversationComposer((value) => !value)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#721100] text-white"
                  aria-label="New conversation"
                >
                  <UserPlus size={18} />
                </button>
              </div>

              {showConversationComposer && (
                <div className="mt-4">
                  <NewConversationPanel
                    role={data?.role}
                    contacts={data?.contacts || []}
                    saving={saving}
                    close={() => setShowConversationComposer(false)}
                    create={createConversation}
                  />
                </div>
              )}

              <div className="mt-5 max-h-[510px] space-y-2 overflow-y-auto">
                {conversations.map((conversation) => {
                  const group = conversation.conversation_type === "group";
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => selectConversation(conversation.id)}
                      className={cx(
                        "w-full rounded-2xl p-4 text-left transition",
                        selectedConversationId === conversation.id
                          ? "bg-[#721100] text-white shadow-lg"
                          : "bg-white text-slate-800 hover:shadow",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cx(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black",
                          selectedConversationId === conversation.id
                            ? "bg-white/10 text-white"
                            : "bg-[#721100]/10 text-[#721100]",
                        )}>
                          {group ? <Users size={17} /> : (conversation.displayTitle || "M")[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black">{conversation.displayTitle}</span>
                          <span className={cx(
                            "mt-1 block truncate text-xs",
                            selectedConversationId === conversation.id ? "text-white/60" : "text-slate-400",
                          )}>
                            {group ? `${conversation.members?.length || 0} members` : pretty(conversation.participant?.otherRole)}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
                {!conversations.length && <EmptyState icon={Users} title="No conversations" text="Start a message above." />}
              </div>
            </aside>

            <section className="flex min-w-0 flex-col">
              {selectedConversation ? (
                <>
                  <header className="border-b border-slate-200 bg-white p-5">
                    {editingTitle ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            autoFocus
                            className={cx(INPUT, "flex-1")}
                            maxLength={120}
                            value={titleDraft}
                            onChange={(event) => setTitleDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") renameConversation(titleDraft);
                              if (event.key === "Escape") setEditingTitle(false);
                            }}
                            placeholder="Conversation name"
                          />
                          <div className="flex gap-2">
                            <Button icon={Check} disabled={saving} onClick={() => renameConversation(titleDraft)}>Save</Button>
                            <Button tone="soft" icon={X} disabled={saving} onClick={() => setEditingTitle(false)}>Cancel</Button>
                            {selectedConversation.title && (
                              <Button tone="soft" disabled={saving} onClick={() => renameConversation("")}>Reset</Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">Everyone in this conversation will see the same name.</p>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">{selectedConversation.displayTitle}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedConversation.conversation_type === "group"
                              ? (selectedConversation.members || []).map((item) => item.display_name).filter(Boolean).join(" · ")
                              : `${pretty(selectedConversation.participant?.otherRole)} · Private conversation`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTitleDraft(selectedConversation.title || selectedConversation.displayTitle || "");
                            setEditingTitle(true);
                          }}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#721100] hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Rename
                        </button>
                      </div>
                    )}
                  </header>

                  <div className="flex-1 space-y-3 overflow-y-auto bg-[#faf8f6] p-5">
                    {conversationMessages.map((item) => {
                      const mine = item.sender_clerk_user_id === workspace.user?.id;
                      const sender = selectedConversation.members?.find((member) => member.clerk_user_id === item.sender_clerk_user_id);
                      const mentionedMe = item.mentions?.some((mention) => mention.mentioned_clerk_user_id === workspace.user?.id);
                      return (
                        <div key={item.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                          <div className={cx(
                            "max-w-[86%] rounded-[1.35rem] px-4 py-3 text-sm shadow-sm",
                            mine ? "rounded-br-md bg-[#721100] text-white" : "rounded-bl-md bg-white text-slate-700",
                            mentionedMe && !mine ? "ring-2 ring-[#dd7d00]/50" : "",
                          )}>
                            {selectedConversation.conversation_type === "group" && !mine && (
                              <p className="mb-1 text-[10px] font-black text-[#dd7d00]">{sender?.display_name || pretty(item.sender_role)}</p>
                            )}
                            {mentionedMe && !mine && (
                              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#fff0d4] px-2 py-1 text-[10px] font-black text-[#721100]">
                                <AtSign size={10} />
                                Mentioned you
                              </span>
                            )}
                            <MessageText body={item.body} mentions={item.mentions || []} mine={mine} />
                            {item.attachments?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.attachments.map((attachment) => (
                                  <AttachmentChip key={attachment.id} attachment={attachment} openAttachment={openAttachment} />
                                ))}
                              </div>
                            )}
                            <p className={cx("mt-2 text-[10px]", mine ? "text-white/55" : "text-slate-400")}>{formatDate(item.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                    {!conversationMessages.length && <EmptyState icon={MessageSquare} title="Start the conversation" text="Messages are private to the people in this thread." />}
                  </div>

                  <form onSubmit={sendDirectMessage} className="border-t border-slate-200 bg-white p-4">
                    <UploadPicker files={messageFiles} setFiles={setMessageFiles} disabled={saving} />
                    <div className="mt-3 flex items-start gap-3">
                      <MentionComposer
                        key={selectedConversationId}
                        value={message}
                        onChange={setMessage}
                        members={selectedConversation.members || []}
                        currentUserId={workspace.user?.id}
                        mentionIds={mentionIds}
                        setMentionIds={setMentionIds}
                        disabled={saving}
                      />
                      <button
                        type="submit"
                        disabled={saving || (!message.trim() && !messageFiles.length)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100] text-white disabled:opacity-40"
                      >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8">
                  <EmptyState icon={MessageSquare} title="Choose a conversation" text="Select a thread or start a new one." />
                </div>
              )}
            </section>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {data?.role === "admin" && showAnnouncementComposer && (
            <Card>
              <div className="flex items-start justify-between gap-4">
                <SectionHeader title="Publish announcement" text="The announcement appears in the portal and is emailed through Google Workspace." />
                <button type="button" onClick={() => setShowAnnouncementComposer(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={publishAnnouncement} className="mt-6 grid gap-4">
                <label className="text-sm font-black text-slate-600">
                  Title
                  <input
                    className={cx(INPUT, "mt-2")}
                    required
                    value={announcement.title}
                    onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })}
                  />
                </label>
                <label className="text-sm font-black text-slate-600">
                  Message
                  <textarea
                    className={cx(INPUT, "mt-2 min-h-36")}
                    required
                    value={announcement.body}
                    onChange={(event) => setAnnouncement({ ...announcement, body: event.target.value })}
                  />
                </label>
                <div>
                  <p className="text-sm font-black text-slate-600">Audience</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {audienceOptions.map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleAudience(value)}
                        className={cx(
                          "rounded-xl border px-3 py-2 text-xs font-black",
                          announcement.audiences.includes(value)
                            ? "border-[#721100] bg-[#721100] text-white"
                            : "border-slate-200 bg-white text-slate-600",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="text-sm font-black text-slate-600">
                  Expires <span className="font-medium text-slate-400">(optional)</span>
                  <input
                    type="datetime-local"
                    className={cx(INPUT, "mt-2")}
                    value={announcement.expiresAt}
                    onChange={(event) => setAnnouncement({ ...announcement, expiresAt: event.target.value })}
                  />
                </label>
                <UploadPicker files={announcementFiles} setFiles={setAnnouncementFiles} disabled={saving} />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    tone="gold"
                    icon={Megaphone}
                    disabled={saving || !announcement.title.trim() || !announcement.body.trim() || !announcement.audiences.length}
                  >
                    {saving ? "Publishing…" : "Publish announcement"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {data?.role === "admin" && !showAnnouncementComposer && (
            <div className="flex justify-end">
              <Button tone="gold" icon={Plus} onClick={() => setShowAnnouncementComposer(true)}>New announcement</Button>
            </div>
          )}

          {(data?.announcements || []).map((item) => (
            <Card key={item.id} className={cx(!item.read_at && data?.role !== "admin" ? "border-[#dd7d00]/40 bg-[#fffaf2]" : "")}>
              <button type="button" onClick={() => readAnnouncement(item)} className="w-full text-left">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Megaphone size={18} className="text-[#dd7d00]" />
                      <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                      {!item.read_at && data?.role !== "admin" && <span className="h-2.5 w-2.5 rounded-full bg-[#dd7d00]" />}
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-400">{formatDate(item.published_at)} · {(item.audiences || []).map(pretty).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={item.email_status} />
                    {data?.role === "admin" && (
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); deleteAnnouncement(item); }}
                        className="rounded-xl bg-rose-50 p-2 text-rose-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.body}</p>
              </button>
              {item.attachments?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.attachments.map((attachment) => (
                    <AttachmentChip key={attachment.id} attachment={attachment} openAttachment={openAttachment} />
                  ))}
                </div>
              )}
            </Card>
          ))}
          {!(data?.announcements || []).length && (
            <EmptyState
              icon={Bell}
              title="No announcements"
              text={data?.role === "admin" ? "Publish an announcement when MLS has an important update." : "MLS announcements will appear here."}
            />
          )}
        </div>
      )}
    </div>
  );
}
