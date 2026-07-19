import { useState } from "react";
import {
  CheckCircle2, Lightbulb, Loader2, MessageSquareText, PencilLine, Send,
  Trash2,
} from "lucide-react";
import { Card, Field, INPUT, SectionHeader, cx } from "./ui";

const REQUEST_TYPES = [
  ["request_new_feature", "Request New Feature", Lightbulb],
  ["update_existing_feature", "Update Existing Feature", PencilLine],
  ["remove_existing_feature", "Remove Existing Feature", Trash2],
];

const FEEDBACK_CATEGORIES = [
  "Home & Dashboard",
  "Assignments & Opportunities",
  "Requests & Scheduling",
  "Communications & Notifications",
  "People & Profiles",
  "Payments, Billing & Finance",
  "Documents & Compliance",
  "Learning & Resources",
  "Settings & Customization",
  "Mobile App & Push Notifications",
  "Accessibility & Usability",
  "Other",
];

const EMPTY = {
  requestType: "request_new_feature",
  category: "",
  comments: "",
};

export default function PortalFeedback({ role, saving = false, submit }) {
  const [draft, setDraft] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(false);
    await submit(draft);
    setDraft(EMPTY);
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]">
            <MessageSquareText size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <SectionHeader title="Feedback" />
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium leading-5 text-amber-900 sm:text-sm sm:leading-6">
              For urgent service, safety, or payment concerns, contact MLS through <b>Communications</b>.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset>
            <legend className="text-sm font-black text-slate-700">What would you like MLS to do? <span className="text-[#721100]">*</span></legend>
            <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-3">
              {REQUEST_TYPES.map(([value, label, Icon]) => {
                const selected = draft.requestType === value;
                return (
                  <label key={value} className={cx(
                    "flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    selected ? "border-[#dd7d00] bg-[#fff7e9] shadow-sm" : "border-slate-200 bg-white hover:border-[#dd7d00]/50",
                  )}>
                    <input
                      type="radio"
                      name="portal-feedback-request-type"
                      value={value}
                      checked={selected}
                      onChange={(event) => setDraft((current) => ({ ...current, requestType: event.target.value }))}
                      className="sr-only"
                    />
                    <span className={cx("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-[#721100] text-white" : "bg-slate-100 text-slate-500")}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-black leading-5 text-slate-900">{label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field name="Portal category" required>
            <select
              required
              value={draft.category}
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
              className={INPUT}
            >
              <option value="">Choose a category</option>
              {FEEDBACK_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>

          <Field name="Your feedback" required help={`${draft.comments.length}/4000 characters`}>
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={draft.comments}
              onChange={(event) => setDraft((current) => ({ ...current, comments: event.target.value }))}
              placeholder="Describe the feature or portal experience you are referencing…"
              className={cx(INPUT, "min-h-44 resize-y leading-6")}
            />
          </Field>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-xs leading-5 text-slate-500">
              Submitted as <b className="capitalize text-slate-700">{role}</b>
            </p>
            <button
              type="submit"
              disabled={saving || !draft.category || draft.comments.trim().length < 10}
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              {saving ? "Submitting…" : "Submit feedback"}
            </button>
          </div>

          {submitted && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800" role="status">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              Thank you. Your feedback has been submitted to MLS.
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
