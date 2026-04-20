import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Laptop2,
  MapPinned,
  MessagesSquare,
  ShieldCheck,
  Video,
} from "lucide-react";

const workflowIconMap = {
  request: ClipboardList,
  review: FileText,
  confirm: CheckCircle2,
  deliver: MessagesSquare,
  closeout: Clock3,
  platform: Laptop2,
  location: MapPinned,
  privacy: ShieldCheck,
  video: Video,
};

function WorkflowTimeline({ steps, palette }) {
  return (
    <div className="rounded-[2rem] border p-6 md:p-8" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
            Workflow
          </p>
          <h3 className="mt-2 text-2xl font-bold" style={{ color: palette.charcoal }}>
            How this service works
          </h3>
        </div>
        <div
          className="hidden rounded-2xl px-4 py-3 text-sm font-medium md:block"
          style={{ backgroundColor: palette.softGray, color: palette.body }}
        >
          Clear process. No guesswork.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = workflowIconMap[step.icon] ?? ClipboardList;
          return (
            <div key={step.title} className="relative">
              <div
                className="flex h-full flex-col rounded-[1.5rem] border p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ borderColor: palette.border, backgroundColor: palette.softGray }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: index % 2 === 0 ? palette.burgundy : palette.gold, color: palette.white }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.body }}>
                    Step {index + 1}
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-semibold" style={{ color: palette.charcoal }}>
                  {step.title}
                </h4>
                <p className="mt-2 text-sm leading-6" style={{ color: palette.body }}>
                  {step.text}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
                  <ArrowRight size={18} style={{ color: palette.gold }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoList({ title, items, palette, dark = false }) {
  return (
    <div
      className="rounded-[2rem] p-6 md:p-8"
      style={{ backgroundColor: dark ? palette.charcoal : palette.white, border: dark ? "none" : `1px solid ${palette.border}` }}
    >
      <h3 className="text-2xl font-bold" style={{ color: dark ? palette.white : palette.charcoal }}>
        {title}
      </h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{
              backgroundColor: dark ? "rgba(255,255,255,0.06)" : palette.softGray,
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}
          >
            <CheckCircle2 size={18} style={{ color: palette.gold, marginTop: 2, flexShrink: 0 }} />
            <span className="text-sm leading-6" style={{ color: dark ? "rgba(255,255,255,0.86)" : palette.body }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ServiceDetail({ palette }) {
  const { serviceId } = useParams();

  const services = {
    "in-person-interpreting": {
      eyebrow: "On-site access",
      title: "In‑Person ASL Interpreting",
      subtitle: "For appointments, meetings, events, and live environments where physical presence, visibility, and nuance matter.",
      description:
        "In-person interpreting is the strongest fit for assignments where real-time communication depends on visual access, room dynamics, pacing, and the ability to respond to subtle human interaction. This service is ideal for healthcare appointments, school meetings, legal consultations, workplace conversations, conferences, community events, and other settings where a qualified interpreter’s physical presence supports smoother, more accurate communication.",
      whyItWorks:
        "Clients are not just booking coverage. They are booking preparation, assignment-fit thinking, visibility planning, and a communication partner who can adapt to the pace and complexity of the setting. For longer, more complex, or especially sensitive encounters, staffing recommendations may include teaming or additional supports when appropriate.",
      settings: ["Medical", "Educational", "Legal", "Business", "Community", "Cruise", "Conference", "Live Events"],
      workflow: [
        {
          icon: "request",
          title: "Request submitted",
          text: "You share the date, time, location, setting, participants, and any known communication considerations.",
        },
        {
          icon: "review",
          title: "Assignment review",
          text: "MLS reviews logistics, determines the right service fit, and identifies prep, travel, or teaming needs.",
        },
        {
          icon: "confirm",
          title: "Confirmation",
          text: "Availability, rates, minimums, and assignment details are confirmed before the job is placed on calendar.",
        },
        {
          icon: "location",
          title: "On-site delivery",
          text: "The interpreter arrives prepared, positioned for visibility, and ready to support direct communication access.",
        },
        {
          icon: "closeout",
          title: "Closeout and invoice",
          text: "After the assignment, any sign-in/out or documentation is completed and invoicing follows the agreed terms.",
        },
      ],
      bestFor: [
        "Medical appointments, exams, and clinical consultations",
        "IEP meetings, conferences, trainings, and educational support",
        "Community meetings, events, and service-provider conversations",
        "Legal or other high-context appointments where nuance matters",
      ],
      prepItems: [
        "Agenda, appointment type, or meeting purpose",
        "Names and roles of participants if known",
        "Specialized vocabulary, handouts, or presentation materials",
        "Location details, parking/access instructions, and start/end expectations",
      ],
      policyTitle: "Rates and policy highlights",
      policyText:
        "On-site rates vary by setting: Community / General and K–12 / Educational begin at $75/hour, Medical / Clinical at $90/hour, Mental Health / Counseling at $95/hour, and Legal (non-court) / Platform / Conference at $110/hour. A two-hour minimum applies per interpreter. Evening, early-morning, weekend, holiday, rush, travel, and prep charges may apply. Cancellations 24–72 hours before start are billed at 50%; under 24 hours are billed in full.",
      faq: [
        {
          question: "When is in-person interpreting the best fit?",
          answer:
            "It is usually the strongest option when the interaction is lengthy, complex, high-stakes, fast-moving, or dependent on room dynamics and visibility.",
        },
        {
          question: "Can I share materials ahead of time?",
          answer:
            "Yes. Advance materials help the interpreter prepare terminology, context, and pacing so the interaction feels smoother for everyone involved.",
        },
        {
          question: "Will one interpreter always be enough?",
          answer:
            "Not always. Depending on duration, intensity, and complexity, MLS may recommend a team or other support structure to protect communication quality.",
        },
      ],
    },
    "video-remote-interpreting": {
      eyebrow: "Remote access",
      title: "Video Remote Interpreting",
      subtitle: "Real-time ASL access for virtual meetings, telehealth, quick-turn requests, and multi-location communication.",
      description:
        "Video Remote Interpreting (VRI) provides live ASL access through a video platform when the participants are meeting remotely or when on-site coverage is not the best fit. It works especially well for virtual meetings, telehealth, distributed teams, and time-sensitive requests that still require a qualified interpreter and a clear visual connection.",
      whyItWorks:
        "Strong VRI depends on more than simply opening a meeting link. It works best when the platform supports clear audio, high-quality video, appropriate framing, and enough visual space for all key participants. MLS uses a practical, client-focused setup process so the session works smoothly instead of feeling improvised.",
      settings: ["Telehealth", "Remote Meetings", "Virtual Intake", "HR Conversations", "Short-Notice Support", "Multi-Site Teams"],
      workflow: [
        {
          icon: "request",
          title: "Request or inquiry",
          text: "You share the platform, date, duration, service context, and whether the session is general or specialized.",
        },
        {
          icon: "platform",
          title: "Platform check",
          text: "MLS confirms that the platform, framing, and audio setup support effective visual communication access.",
        },
        {
          icon: "confirm",
          title: "Scheduling",
          text: "The interpreter is booked, links are exchanged, and expectations are confirmed before the session begins.",
        },
        {
          icon: "video",
          title: "Live VRI session",
          text: "The interpreter joins the call and provides real-time communication access throughout the appointment or meeting.",
        },
        {
          icon: "closeout",
          title: "Time capture and invoice",
          text: "Session time is recorded and invoiced according to the agreed structure and any applicable differentials.",
        },
      ],
      bestFor: [
        "Telehealth and virtual appointments",
        "Remote meetings and internal staff conversations",
        "Shorter assignments or distributed participants in different locations",
        "Situations where a secure virtual setup is more practical than travel",
      ],
      prepItems: [
        "Meeting link or platform details",
        "Names and roles of participants if available",
        "Any presentation files, agenda, or relevant terminology",
        "A quick sound/video test for important or high-stakes sessions",
      ],
      policyTitle: "Rates and policy highlights",
      policyText:
        "General VRI / Remote assignments begin at $65/hour and Specialized Remote assignments (such as medical, legal, or mental health contexts) begin at $75/hour. A one-hour minimum applies per interpreter. Evening, early-morning, weekend, holiday, rush, and prep charges may apply. The client platform must support clear audio, reliable video, and an appropriate visual setup.",
      faq: [
        {
          question: "Is VRI right for every situation?",
          answer:
            "No. Some settings are better served in person, especially when visibility, complexity, participant movement, or environmental demands make remote access less effective.",
        },
        {
          question: "Can MLS use my platform?",
          answer:
            "Usually yes, as long as the platform supports stable video, clear audio, and appropriate participant visibility.",
        },
        {
          question: "What about privacy-sensitive settings?",
          answer:
            "MLS can work within privacy-conscious workflows when the client’s platform and setup support the level of confidentiality the setting requires.",
        },
      ],
    },
    "english-asl-translation": {
      eyebrow: "Recorded accessibility",
      title: "English → ASL Video Translation",
      subtitle: "Turn written or spoken English content into polished ASL video for stronger, more inclusive communication.",
      description:
        "This service is built for organizations that need information transformed into clear, natural ASL video rather than simply read aloud or mirrored word-for-word from English. It is a strong fit for patient education, onboarding, policy updates, public-facing information, training content, internal announcements, and other materials that need to be genuinely accessible to Deaf viewers.",
      whyItWorks:
        "Good translation is not just performance on camera. It includes source review, terminology alignment, audience awareness, recording decisions, and delivery planning. MLS approaches these projects as communication products, not as a quick add-on. That means the final result is easier to understand, more visually natural, and more useful to the audience it is meant to serve.",
      settings: ["Patient Education", "Training Content", "Public Information", "Website Accessibility", "Internal Announcements", "Organizational Messaging"],
      workflow: [
        {
          icon: "request",
          title: "Source materials submitted",
          text: "You provide the script, document, recording, or other source content that needs to become ASL video.",
        },
        {
          icon: "review",
          title: "Scope and audience review",
          text: "MLS reviews language level, terminology, audience needs, revision expectations, and delivery format.",
        },
        {
          icon: "video",
          title: "Translation and production",
          text: "The content is translated for ASL delivery, recorded, and prepared according to the agreed production scope.",
        },
        {
          icon: "confirm",
          title: "Review and refinement",
          text: "If included in scope, review notes are incorporated so the final message aligns with the project goals.",
        },
        {
          icon: "deliver",
          title: "Final file delivery",
          text: "You receive the finished ASL video in the agreed format, ready for posting, sharing, or internal use.",
        },
      ],
      bestFor: [
        "Organizations creating patient or client education videos",
        "Accessible internal communications and onboarding materials",
        "Short training clips, notices, and public information messages",
        "Projects that need communication access beyond captions alone",
      ],
      prepItems: [
        "Final or near-final source script/content",
        "Any required terminology, names, acronyms, or brand language",
        "Desired delivery format and posting environment",
        "Revision expectations and target timeline",
      ],
      policyTitle: "Rates and policy highlights",
      policyText:
        "English → ASL video translation is quoted per project after source review. Scope depends on source length, technical terminology, production expectations, revision rounds, delivery format, and turnaround timing. Preparation and review time may be billed as needed, and rush terms may apply when feasible.",
      faq: [
        {
          question: "Why isn’t this priced like live interpreting?",
          answer:
            "Because translation projects vary widely in source length, terminology, production scope, revision needs, and final deliverables. Project-based pricing keeps the quote accurate.",
        },
        {
          question: "Can I request revisions?",
          answer:
            "Yes. Revision scope is discussed during quoting so expectations are clear before recording begins.",
        },
        {
          question: "What kinds of files can I send?",
          answer:
            "Scripts, documents, web copy, slide content, recorded audio, and similar source materials are all common starting points.",
        },
      ],
    },
    "asl-english-translation": {
      eyebrow: "Documentation and reuse",
      title: "ASL → English Translation",
      subtitle: "Convert ASL video into polished English transcripts, captions, summaries, or documentation-ready text.",
      description:
        "ASL → English translation is ideal when a client has information in ASL and needs it converted into usable English outputs. That may mean transcripts, captions, summaries, polished written translation, or English-facing documentation for internal or public use. This is especially helpful for interviews, ASL video submissions, educational content, event recordings, archived messages, and communication that needs to move across language environments without losing meaning.",
      whyItWorks:
        "The value here is not just ‘typing out a video.’ It is careful interpretation of meaning, context, structure, and intended use. MLS helps clients choose the right output format first, then prepares the English deliverable in a way that is actually useful for publication, review, recordkeeping, or accessibility.",
      settings: ["Transcripts", "Captions", "Documentation", "Archived Content", "Interview Review", "Educational Materials"],
      workflow: [
        {
          icon: "request",
          title: "Source video received",
          text: "You submit the ASL source content along with your target format, timeline, and any context that will shape the output.",
        },
        {
          icon: "review",
          title: "Scope and output planning",
          text: "MLS confirms whether you need captions, transcript text, a polished written translation, a summary, or a combination.",
        },
        {
          icon: "file",
          title: "Translation drafting",
          text: "The ASL content is reviewed and converted into the requested English format with attention to meaning and clarity.",
        },
        {
          icon: "privacy",
          title: "QA and formatting",
          text: "Files are checked for consistency, readability, and format expectations before final delivery.",
        },
        {
          icon: "deliver",
          title: "Final delivery",
          text: "You receive the completed English output in the agreed file type or publication-ready format.",
        },
      ],
      bestFor: [
        "ASL video submissions that need English review or documentation",
        "Recorded interviews, messages, or event content",
        "Captioning or transcript support for visual-language materials",
        "Organizations that need English-ready reuse of ASL source content",
      ],
      prepItems: [
        "Source video file or access link",
        "Desired final format (transcript, caption file, summary, etc.)",
        "Any required names, terms, or contextual notes",
        "Target timeline and revision expectations",
      ],
      policyTitle: "Rates and policy highlights",
      policyText:
        "ASL → English projects are quoted after source review because scope depends on video length, content density, terminology, target format, revision needs, and turnaround. Preparation and review time may be billed as needed, and rush timelines are available when feasible. Net 30 invoicing and broader service policies follow the agreed assignment terms.",
      faq: [
        {
          question: "What’s the difference between a transcript and a polished translation?",
          answer:
            "A transcript aims to document content closely, while a polished translation is shaped more intentionally for clarity, readability, and end use in English.",
        },
        {
          question: "Can captions be included?",
          answer:
            "Yes. Captioning can be part of the deliverable if that is built into the scope during quoting.",
        },
        {
          question: "How is pricing determined?",
          answer:
            "Quotes depend on source length, complexity, output type, turnaround, and whether revisions or formatting work are required.",
        },
      ],
    },
  };

  const service = services[serviceId];

  if (!service) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="text-center">
          <h1 style={{ color: palette.charcoal }} className="text-3xl font-bold">
            Service not found
          </h1>
          <Link to="/services" className="btn btn-primary mt-6 inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
      <Link to="/services" className="btn btn-secondary mb-8 inline-flex items-center gap-2">
        <ArrowLeft size={16} />
        Back to Services
      </Link>

      <section
        className="overflow-hidden rounded-[2.25rem] border p-8 shadow-sm md:p-12"
        style={{ borderColor: palette.border, backgroundColor: palette.white }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
          {service.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
          {service.title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8" style={{ color: palette.body }}>
          {service.subtitle}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {service.settings.map((item) => (
            <span
              key={item}
              className="rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: palette.border, backgroundColor: palette.softGray, color: palette.charcoal }}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-base leading-8" style={{ color: palette.body }}>
              {service.description}
            </p>
            <p className="mt-5 text-base leading-8" style={{ color: palette.body }}>
              {service.whyItWorks}
            </p>
          </div>

          <div
            className="rounded-[2rem] p-6"
            style={{ backgroundColor: palette.charcoal }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
              Quick view
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/85">
              <div>
                <span className="font-semibold text-white">Best for:</span> assignments that need clarity, planning, and a stronger fit than generic coverage.
              </div>
              <div>
                <span className="font-semibold text-white">Booking style:</span> service-specific review with rates and logistics confirmed before delivery.
              </div>
              <div>
                <span className="font-semibold text-white">Next step:</span> submit your request with as much detail and prep material as possible.
              </div>
            </div>
            <Link to="/contact" className="btn btn-primary mt-6 inline-flex items-center gap-2">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-10">
        <WorkflowTimeline steps={service.workflow} palette={palette} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <InfoList title="When this service is the right fit" items={service.bestFor} palette={palette} />
        <InfoList title="What to prepare before booking" items={service.prepItems} palette={palette} dark />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div
          className="rounded-[2rem] border p-6 md:p-8"
          style={{ borderColor: palette.border, backgroundColor: palette.white }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
            Policy alignment
          </p>
          <h3 className="mt-2 text-2xl font-bold" style={{ color: palette.charcoal }}>
            {service.policyTitle}
          </h3>
          <p className="mt-4 text-sm leading-7" style={{ color: palette.body }}>
            {service.policyText}
          </p>
          <p className="mt-4 text-sm leading-7" style={{ color: palette.body }}>
            Full quotes are confirmed after reviewing assignment details, logistics, and any service-specific needs.
          </p>
        </div>

        <div
          className="rounded-[2rem] p-6 md:p-8"
          style={{ backgroundColor: palette.softGray }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
            Frequently asked
          </p>
          <div className="mt-5 space-y-5">
            {service.faq.map((item) => (
              <div key={item.question} className="rounded-2xl bg-white p-5 shadow-sm">
                <h4 className="text-base font-semibold" style={{ color: palette.charcoal }}>
                  {item.question}
                </h4>
                <p className="mt-2 text-sm leading-7" style={{ color: palette.body }}>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-[2rem] p-8 shadow-sm" style={{ backgroundColor: palette.charcoal }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
              Ready to move forward?
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              Let’s build the right communication setup for your assignment.
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Send the details you already have. MLS will review the request, confirm the best service fit, and provide the next steps clearly.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact" className="btn btn-primary inline-flex items-center gap-2">
              Request a Quote
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.18)" }}
            >
              Compare Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
