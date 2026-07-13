import { ClipboardCheck, Loader2 } from "lucide-react";
import { Field, INPUT, Modal, cx } from "./ui";

export default function BidModal({ controller }) {
  const {
    modal, setModal, bidDraft, setBidDraft, bidOpportunity,
    saving, submitBid,
  } = controller;

  return (
    <Modal
      open={modal === "bid"}
      close={() => setModal("")}
      title="Bid for assignment"
      subtitle={bidOpportunity?.assignments?.service_type}
    >
      <form onSubmit={submitBid} className="space-y-4">
        <Field name="Requested hourly rate">
          <input
            className={INPUT}
            type="number"
            min="0"
            step="0.01"
            value={bidDraft.bidRate}
            onChange={(event) => setBidDraft({ ...bidDraft, bidRate: event.target.value })}
          />
        </Field>
        <Field name="Message to MLS">
          <textarea
            className={cx(INPUT, "min-h-32")}
            value={bidDraft.message}
            onChange={(event) => setBidDraft({ ...bidDraft, message: event.target.value })}
            placeholder="Availability, teaming considerations, travel, or other important context"
          />
        </Field>
        <button
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <ClipboardCheck size={16} />}
          Submit bid
        </button>
      </form>
    </Modal>
  );
}
