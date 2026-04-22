import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import {
  buildGreeting,
  getContactActions,
  getFallbackResponse,
  getStarterPrompts,
} from '../lib/siteAssistantKnowledge';

const STORAGE_KEY = 'mls-site-assistant-v1';

const palette = {
  burgundy: '#721100',
  gold: '#dd7d00',
  charcoal: '#464747',
  white: '#ffffff',
  softGray: '#f5f5f5',
  border: '#e5e5e5',
  body: '#444444',
};

function AssistantLink({ action }) {
  const className =
    'inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5';

  const style = {
    backgroundColor: action.type === 'primary' ? palette.gold : `${palette.gold}12`,
    color: action.type === 'primary' ? palette.white : palette.charcoal,
    border: action.type === 'primary' ? 'none' : `1px solid ${palette.border}`,
  };

  if (action.type === 'link') {
    return (
      <Link to={action.href} className={className} style={style}>
        {action.label}
      </Link>
    );
  }

  return (
    <a href={action.href} className={className} style={style}>
      {action.label}
    </a>
  );
}

export default function SiteAssistant() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const threadRef = useRef(null);

  const starters = useMemo(() => getStarterPrompts(location.pathname), [location.pathname]);
  const footerActions = useMemo(
    () =>
      getContactActions(location.pathname).map((action, index) => ({
        ...action,
        type: index === 0 ? 'primary' : action.type || 'secondary',
      })),
    [location.pathname],
  );

  useEffect(() => {
    if (!messages.length) {
      setMessages([
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: buildGreeting(location.pathname),
          actions: footerActions,
        },
      ]);
    }
  }, [footerActions, location.pathname, messages.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage failures
    }
  }, [messages]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text || loading) return;

    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft('');
    setOpen(true);
    setLoading(true);

    try {
      const response = await fetch('/api/site-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          pageContext: { pathname: location.pathname },
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch assistant response.');

      const data = await response.json();
      const fallback = getFallbackResponse({ message: text, pathname: location.pathname });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || fallback.reply,
          actions: data.actions?.length ? data.actions : fallback.actions,
        },
      ]);
    } catch {
      const fallback = getFallbackResponse({ message: text, pathname: location.pathname });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fallback.reply,
          actions: fallback.actions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        id="mls-site-assistant"
        className={`fixed right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_25px_80px_rgba(0,0,0,0.18)] transition-all duration-300 md:right-6 ${
          open ? 'bottom-24 opacity-100 md:bottom-6' : 'pointer-events-none bottom-28 translate-y-4 opacity-0 md:bottom-28'
        }`}
        style={{ borderColor: palette.border }}
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-4 py-4"
          style={{ borderColor: palette.border, backgroundColor: palette.charcoal }}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">MLS Assistant</div>
            <div className="mt-1 text-sm font-semibold text-white">Ask about services, booking, or contact options</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b px-4 py-3" style={{ borderColor: palette.border }}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: palette.burgundy }}>
            Quick questions
          </div>
          <div className="flex flex-wrap gap-2">
            {starters.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-full border px-3 py-2 text-left text-xs font-medium transition hover:-translate-y-0.5"
                style={{ borderColor: palette.border, backgroundColor: palette.softGray, color: palette.charcoal }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div ref={threadRef} className="max-h-[46vh] min-h-[240px] space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === 'assistant' ? 'rounded-bl-md' : 'rounded-br-md'
                }`}
                style={{
                  backgroundColor: message.role === 'assistant' ? palette.softGray : palette.gold,
                  color: message.role === 'assistant' ? palette.body : palette.white,
                }}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.role === 'assistant' && message.actions?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <AssistantLink key={`${action.label}-${action.href}`} action={action} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm"
                style={{ backgroundColor: palette.softGray, color: palette.body }}
              >
                Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(draft);
          }}
          className="border-t px-4 py-4"
          style={{ borderColor: palette.border }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your question here…"
              rows={2}
              className="min-h-[48px] flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2"
              style={{ borderColor: palette.border, color: palette.charcoal }}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: palette.gold, color: palette.white }}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {footerActions.map((action) => (
              <AssistantLink key={`${action.label}-${action.href}`} action={action} />
            ))}
          </div>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-24 right-4 z-[65] inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 md:bottom-6 md:right-6"
        style={{ backgroundColor: open ? palette.charcoal : palette.gold, color: palette.white }}
        aria-expanded={open}
        aria-controls="mls-site-assistant"
      >
        <MessageCircle size={18} />
        <span>{open ? 'Hide Assistant' : 'Ask MLS'}</span>
      </button>
    </>
  );
}
