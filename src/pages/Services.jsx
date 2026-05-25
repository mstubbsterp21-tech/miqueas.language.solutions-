import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  FileVideo,
  Globe,
  GraduationCap,
  Layers3,
  MessageSquareText,
  MonitorUp,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const serviceCards = [
  {
    id: "in-person-interpreting",
    icon: Users,
    title: "In-Person Interpreting",
    text: "On-site communication access for appointments, meetings, events, and live environments where presence, visibility, and nuance matter.",
    label: "On-site • High-context • Live interaction",
  },
  {
    id: "video-remote-interpreting",
    icon: Video,
    title: "Video Remote Interpreting",
    text: "Real-time ASL access for telehealth, virtual meetings, short-notice requests, and remote communication across locations.",
    label: "Remote • Flexible • Real-time access",
  },
  {
    id: "english-asl-translation",
    icon: FileVideo,
    title: "English → ASL Translation",
    text: "Recorded ASL video translation for information that needs to be clearly and naturally communicated to Deaf viewers.",
    label: "Recorded • Accessible • Audience-focused",
  },
  {
    id: "asl-english-translation",
    icon: Globe,
    title: "ASL → English Translation",
    text: "English transcripts, captions, summaries, or documentation-ready outputs created from ASL source content.",
    label: "Documentation • Clarity • Reusable content",
  },
];

const specialtyCards = [
  { icon: Stethoscope, title: "Medical" },
  { icon: GraduationCap, title: "Educational" },
  { icon: BriefcaseBusiness, title: "Business" },
  { icon: Users, title: "Community" },
];

const workflow = [
  { icon: ClipboardList, title: "Request", copy: "Submit the assignment details you have, even if some logistics still need to be confirmed." },
  { icon: Layers3, title: "Review", copy: "MLS reviews setting, modality, timing, preparation materials, and interpreter fit." },
  { icon: CalendarCheck2, title: "Confirm", copy: "You receive follow-up with availability, quote details, and next steps before services are finalized." },
];

const comparisonRows = [
  {
    label: "Best fit",
    values: [
      "Live, on-site interactions with room dynamics or higher stakes",
      "Remote meetings and appointments with strong platform setup",
      "English content that needs accessible ASL video delivery",
      "ASL content that needs an English transcript, caption, or written output",
    ],
  },
  {
    label: "Typical workflow",
    values: [
      "Request → logistics review → on-site delivery",
      "Request → platform check → live virtual delivery",
      "Source review → translation planning → record/edit/deliver",
      "Source review → output planning → translate/format/deliver",
    ],
  },
  {
    label: "Pricing structure",
    values: [
      "Setting-based hourly rates with minimums and applicable differentials",
      "Remote hourly rates with minimums and applicable differentials",
      "Project-based quote after source review",
      "Project-based quote after source review",
    ],
  },
];

const useCases = [
  "A clinic needs on-site support for a specialist appointment with technical vocabulary and multiple participants.",
  "A company needs VRI for a remote meeting involving Deaf and hearing staff across different locations.",
  "An organization wants public-facing information translated into clear, polished ASL video.",
  "An employer has ASL video responses that need transcripts, captions, or English summaries.",
];

export default function Services({ palette }) {
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };
  const goldButton = { backgroundColor: palette.gold, color: palette.white };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 92% 8%, rgba(114,17,0,0.14), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
                <MonitorUp size={15} style={{ color: palette.gold }} />
                Services
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Choose the service that fits the communication need.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                MLS provides ASL/English interpreting and ASL video translation services with attention to context, logistics, preparation, and the people involved.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                  Request a Quote
                  <ArrowRight size={17} />
                </Link>
                <Link to="/clients" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                  Client Planning Guide
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {specialtyCards.map(({ icon: Icon, title }) => (
                  <div key={title} className="flex items-center gap-3 rounded-full border bg-white/80 px-4 py-2 text-sm font-bold shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.charcoal }}>
                    <Icon size={16} style={{ color: palette.gold }} />
                    {title}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-7 -top-7 h-32 w-32 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="absolute -bottom-7 -left-7 h-28 w-28 rounded-full opacity-80" style={{ backgroundColor: palette.gold }} />
              <div className="relative rounded-[2.2rem] border bg-white p-5 shadow-2xl" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#202020] p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Service catalog</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight">Live access and recorded language solutions.</h2>
                  <div className="mt-6 grid gap-3">
                    {serviceCards.map(({ icon: Icon, title }) => (
                      <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <Icon size={21} style={{ color: palette.gold }} />
                        <span className="text-sm font-bold">{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.5rem] border bg-[#f7f3ef] p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>One intake standard</p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>Every service starts with the details needed to quote responsibly.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Service options</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Different needs call for different workflows.</h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="group relative overflow-hidden rounded-[1.75rem] border bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl" style={cardStyle}>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ backgroundColor: palette.gold }} />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                    <Icon size={23} />
                  </div>
                  <h3 className="mt-5 text-xl font-black" style={{ color: palette.charcoal }}>{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">{card.text}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: palette.burgundy }}>{card.label}</p>
                  <Link to={`/services/${card.id}`} className="mt-7 inline-flex items-center gap-2 text-sm font-bold transition group-hover:gap-3" style={{ color: palette.gold }}>
                    Explore this service
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>How it works</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>One intake process. Different service paths.</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">The same request form starts the process, but the workflow changes depending on whether you need live interpreting, remote access, or translation work.</p>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {workflow.map(({ icon: Icon, title, copy }, index) => (
                <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-6 text-center shadow-sm" style={cardStyle}>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: index === 1 ? palette.burgundy : palette.gold }}><Icon size={22} /></div>
                  <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2rem] border bg-[#202020] p-7 md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Compare options</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">Which service fits your request?</h2>
              <p className="mt-5 text-base leading-8 text-white/75">Every request still goes through the same quote process, but the service type changes preparation, workflow, and pricing structure.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Live access", "Remote support", "ASL video", "English output"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-white/85">{item}</div>
                ))}
              </div>
            </motion.div>

            <div className="space-y-4">
              {comparisonRows.map((row, rowIndex) => (
                <motion.div key={row.label} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: rowIndex * 0.04 }} className="rounded-[1.5rem] border bg-white p-5 shadow-sm" style={cardStyle}>
                  <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: palette.gold }}>{row.label}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {row.values.map((value, index) => (
                      <div key={`${row.label}-${index}`} className="rounded-2xl bg-[#f7f3ef] p-4 text-sm leading-6" style={{ color: palette.body }}>
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em]" style={{ color: palette.burgundy }}>{serviceCards[index].title}</span>
                        {value}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Real-world use cases</p>
              <div className="mt-5 space-y-3">
                {useCases.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#f7f3ef] p-4">
                    <CheckCircle2 size={18} style={{ color: palette.gold, marginTop: 2, flexShrink: 0 }} />
                    <span className="text-sm leading-6" style={{ color: palette.body }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: 0.05 }} className="overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
              <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
                <div className="bg-[#202020] p-7 md:p-9">
                  <p className="text-sm font-semibold leading-7 text-white/70">“The service type matters because the communication need, preparation, and delivery format are not always the same.”</p>
                </div>
                <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[320px] md:p-9">
                  <p className="text-sm leading-6 text-[#5f6368]">Ready to choose the right service path?</p>
                  <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request a Quote <ArrowRight size={17} /></Link>
                  <p className="text-xs font-medium text-[#777]">MLS will review the details before confirming fit</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
