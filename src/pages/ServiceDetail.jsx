import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

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
  file: FileText,
};

function WorkflowTimeline({ steps, palette }) {
  return (
    <section className="px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Workflow</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>How this service works.</h2>
          <p className="mt-4 text-base leading-8 text-[#5f6368]">Clear steps help the request move forward without guesswork.</p>
        </motion.div>

        <div className="grid auto-rows-fr gap-4 md:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = workflowIconMap[step.icon] ?? ClipboardList;
            return (
              <motion.div key={step.title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="relative h-full">
                <div className="flex h-full flex-col rounded-[1.5rem] border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: palette.border }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: index % 2 === 0 ? palette.gold : palette.burgundy }}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: palette.body }}>Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#666]">{step.text}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
                    <ArrowRight size={18} style={{ color: palette.gold }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InfoList({ title, items, palette, dark = false }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="h-full rounded-[2rem] border p-6 md:p-8" style={{ borderColor: dark ? "rgba(255,255,255,0.10)" : palette.border, backgroundColor: dark ? "#202020" : palette.white }}>
      <h3 className="text-2xl font-black" style={{ color: dark ? palette.white : palette.charcoal }}>{title}</h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#f7f3ef", border: dark ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <CheckCircle2 size={18} style={{ color: palette.gold, marginTop: 2, flexShrink: 0 }} />
            <span className="text-sm leading-6" style={{ color: dark ? "rgba(255,255,255,0.82)" : palette.body }}>{item}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ServiceDetail({ palette }) {
  const { serviceId } = useParams();

  const services = {
    "in-person-interpreting": {
      eyebrow: "On-site access",
      title: "In-Person ASL Interpreting",
      subtitle: "For appointments, meetings, events, and live environments where physical presence, visibility, and nuance matter.",
      description:
        "In-person interpreting is the strongest fit for assignments where real-time communication depends on visual access, room dynamics, pacing, and the ability to respond to subtle human interaction. This service is ideal for healthcare appointments, school meetings, legal consultations, workplace conversations, conferences, community events, and other settings where a qualified interpreter’s physical presence supports smoother, more accurate communication.",
      whyItWorks:
        "Clients are not just booking coverage. They are booking preparation, assignment-fit thinking, visibility planning, and a communication partner who can adapt to the pace and complexity of the setting. For longer, more complex, or especially sensitive encounters, staffing recommendations may include teaming or additional supports when appropriate.",
      settings: ["Medical", "Educational", "Legal", "Business", "Community", "Cruise", "Conference", "Live Events"],
      workflow: [
        { icon: "request", title: "Request submitted", text: "You share the date, time, location, setting, participants, and any known communication considerations." },
        { icon: "review", title: "Assignment review", text: "MLS reviews logistics, determines the right service fit, and identifies prep, travel, or teaming needs." },
        { icon: "confirm", title: "Confirmation", text: "Availability, rates, minimums, and assignment details are confirmed before the job is placed on calendar." },
        { icon: "location", title: "On-site delivery", text: "The interpreter arrives prepared, positioned for visibility, and ready to support direct communication access." },
        { icon: "closeout", title: "Closeout", text: "After the assignment, documentation is completed and invoicing follows the agreed terms." },
      ],
      bestFor: ["Medical appointments, exams, and clinical consultations", "IEP meetings, conferences, trainings, and educational support", "Community meetings, events, and service-provider conversations", "Legal or other high-context appointments where nuance matters"],
      prepItems: ["Agenda, appointment type, or meeting purpose", "Names and roles of participants if known", "Specialized vocabulary, handouts, or presentation materials", "Location details, parking/access instructions, and start/end expectations"],
      policyTitle: "Rates and policy highlights",
      policyText: "On-site rates vary by setting and assignment type. A two-hour minimum applies per interpreter. Evening, early-morning, weekend, holiday, rush, travel, and prep charges may apply. Full quotes are confirmed after reviewing assignment details.",
    },
    "video-remote-interpreting": {
      eyebrow: "Remote access",
      title: "Video Remote Interpreting",
      subtitle: "Real-time ASL access for virtual meetings, telehealth, quick-turn requests, and multi-location communication.",
      description:
        "Video Remote Interpreting provides live ASL access through a video platform when the participants are meeting remotely or when on-site coverage is not the best fit. It works especially well for virtual meetings, telehealth, distributed teams, and time-sensitive requests that still require a qualified interpreter and a clear visual connection.",
      whyItWorks:
        "Strong VRI depends on more than simply opening a meeting link. It works best when the platform supports clear audio, high-quality video, appropriate framing, and enough visual space for all key participants.",
      settings: ["Telehealth", "Remote Meetings", "Virtual Intake", "HR Conversations", "Short-Notice Support", "Multi-Site Teams"],
      workflow: [
        { icon: "request", title: "Request or inquiry", text: "You share the platform, date, duration, service context, and whether the session is general or specialized." },
        { icon: "platform", title: "Platform check", text: "MLS confirms that the platform, framing, and audio setup support effective visual communication access." },
        { icon: "confirm", title: "Scheduling", text: "The interpreter is booked, links are exchanged, and expectations are confirmed before the session begins." },
        { icon: "video", title: "Live VRI session", text: "The interpreter joins the call and provides real-time communication access throughout the appointment or meeting." },
        { icon: "closeout", title: "Closeout", text: "Session time is recorded and invoiced according to the agreed structure and applicable terms." },
      ],
      bestFor: ["Telehealth and virtual appointments", "Remote meetings and internal staff conversations", "Shorter assignments or distributed participants in different locations", "Situations where a secure virtual setup is more practical than travel"],
      prepItems: ["Meeting link or platform details", "Names and roles of participants if available", "Any presentation files, agenda, or relevant terminology", "A quick sound/video test for important or high-stakes sessions"],
      policyTitle: "Rates and policy highlights",
      policyText: "Remote assignments use remote hourly rates with applicable minimums and differentials. The client platform must support clear audio, reliable video, and an appropriate visual setup.",
    },
    "english-asl-translation": {
      eyebrow: "Recorded accessibility",
      title: "English → ASL Video Translation",
      subtitle: "Turn written or spoken English content into polished ASL video for stronger, more inclusive communication.",
      description:
        "This service is built for organizations that need information transformed into clear, natural ASL video rather than simply read aloud or mirrored word-for-word from English. It is a strong fit for patient education, onboarding, policy updates, public-facing information, training content, and internal announcements.",
      whyItWorks:
        "Good translation includes source review, terminology alignment, audience awareness, recording decisions, and delivery planning. MLS approaches these projects as communication products, not as a quick add-on.",
      settings: ["Patient Education", "Training Content", "Public Information", "Website Accessibility", "Internal Announcements", "Organizational Messaging"],
      workflow: [
        { icon: "request", title: "Source submitted", text: "You provide the script, document, recording, or source content that needs to become ASL video." },
        { icon: "review", title: "Scope review", text: "MLS reviews language level, terminology, audience needs, revision expectations, and delivery format." },
        { icon: "video", title: "Production", text: "The content is translated for ASL delivery, recorded, and prepared according to the agreed production scope." },
        { icon: "confirm", title: "Refinement", text: "If included in scope, review notes are incorporated so the final message aligns with project goals." },
        { icon: "deliver", title: "Final delivery", text: "You receive the finished ASL video in the agreed format, ready for posting, sharing, or internal use." },
      ],
      bestFor: ["Organizations creating patient or client education videos", "Accessible internal communications and onboarding materials", "Short training clips, notices, and public information messages", "Projects that need communication access beyond captions alone"],
      prepItems: ["Final or near-final source script/content", "Required terminology, names, acronyms, or brand language", "Desired delivery format and posting environment", "Revision expectations and target timeline"],
      policyTitle: "Rates and policy highlights",
      policyText: "English → ASL video translation is quoted per project after source review. Scope depends on source length, terminology, production expectations, revision rounds, delivery format, and turnaround timing.",
    },
    "asl-english-translation": {
      eyebrow: "Documentation and reuse",
      title: "ASL → English Translation",
      subtitle: "Convert ASL video into polished English transcripts, captions, summaries, or documentation-ready text.",
      description:
        "ASL → English translation is ideal when a client has information in ASL and needs it converted into usable English outputs. That may mean transcripts, captions, summaries, polished written translation, or English-facing documentation for internal or public use.",
      whyItWorks:
        "The value here is not just typing out a video. It is careful interpretation of meaning, context, structure, and intended use. MLS helps clients choose the right output format first, then prepares the English deliverable in a way that is useful.",
      settings: ["Transcripts", "Captions", "Documentation", "Archived Content", "Interview Review", "Educational Materials"],
      workflow: [
        { icon: "request", title: "Source received", text: "You submit the ASL source content along with your target format, timeline, and any context." },
        { icon: "review", title: "Output planning", text: "MLS confirms whether you need captions, transcript text, polished translation, summary, or a combination." },
        { icon: "file", title: "Translation drafting", text: "The ASL content is reviewed and converted into the requested English format with attention to meaning." },
        { icon: "privacy", title: "QA and formatting", text: "Files are checked for consistency, readability, and format expectations before final delivery." },
        { icon: "deliver", title: "Final delivery", text: "You receive the completed English output in the agreed file type or publication-ready format." },
      ],
      bestFor: ["ASL video submissions that need English review or documentation", "Recorded interviews, messages, or event content", "Captioning or transcript support for visual-language materials", "Organizations that need English-ready reuse of ASL source content"],
      prepItems: ["Source video file or access link", "Desired final format", "Required names, terms, or contextual notes", "Target timeline and revision expectations"],
      policyTitle: "Rates and policy highlights",
      policyText: "ASL → English projects are quoted after source review because scope depends on video length, content density, terminology, target format, revision needs, and turnaround.",
    },
  };

  const service = services[serviceId];
  const goldButton = { backgroundColor: palette.gold, color: palette.white };

  if (!service) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="text-center">
          <h1 style={{ color: palette.charcoal }} className="text-3xl font-black">Service not found</h1>
          <Link to="/services" className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md" style={goldButton}>
            <ArrowLeft size={16} /> Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 92% 8%, rgba(114,17,0,0.14), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <Link to="/services" className="mb-8 inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
            <ArrowLeft size={16} /> Back to Services
          </Link>
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{service.eyebrow}</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>{service.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">{service.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request a Quote <ArrowRight size={17} /></Link>
                <Link to="/services" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>Compare Services</Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px] lg:mx-0">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-80" style={{ backgroundColor: palette.gold }} />
              <div className="relative rounded-[2.2rem] border bg-white p-4 shadow-2xl md:p-5" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#202020] p-6 text-white md:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Quick view</p>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-white/82">
                    <div><span className="font-bold text-white">Best for:</span> assignments that need clarity, planning, and the right service fit.</div>
                    <div><span className="font-bold text-white">Booking style:</span> review first, confirm details, then schedule or deliver.</div>
                    <div><span className="font-bold text-white">Next step:</span> submit your request with as much detail as possible.</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.settings.slice(0, 6).map((item) => (
                    <span key={item} className="rounded-full border bg-[#f7f3ef] px-3 py-2 text-xs font-bold" style={{ borderColor: palette.border, color: palette.burgundy }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Service overview</p>
              <p className="mt-4 text-base leading-8" style={{ color: palette.body }}>{service.description}</p>
              <p className="mt-5 text-base leading-8" style={{ color: palette.body }}>{service.whyItWorks}</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: 0.04 }} className="rounded-[2rem] border bg-[#202020] p-6 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Policy alignment</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white">{service.policyTitle}</h2>
              <p className="mt-5 text-sm leading-7 text-white/72">{service.policyText}</p>
              <p className="mt-4 text-sm leading-7 text-white/72">Full quotes are confirmed after reviewing assignment details, logistics, and any service-specific needs.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <WorkflowTimeline steps={service.workflow} palette={palette} />

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-6xl auto-rows-fr gap-6 lg:grid-cols-2">
          <InfoList title="When this service is the right fit" items={service.bestFor} palette={palette} />
          <InfoList title="What to prepare before booking" items={service.prepItems} palette={palette} dark />
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
          <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
            <div className="bg-[#202020] p-7 md:p-9">
              <p className="text-sm font-semibold leading-7 text-white/70">“The right service path depends on the setting, the communication goal, and the level of preparation needed.”</p>
            </div>
            <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[340px] md:p-9">
              <p className="text-sm leading-6 text-[#5f6368]">Ready to move forward?</p>
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request a Quote <ArrowRight size={17} /></Link>
              <Link to="/services" className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>Compare Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
