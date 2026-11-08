import { Link, Navigate, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays,
  CheckCircle2, ChevronDown, ClipboardList, FileText, GraduationCap, HeartHandshake,
  Landmark, MapPin, MessageSquareText, MonitorPlay, Presentation, ShieldCheck,
  Stethoscope, Users
} from "lucide-react";
import { settingOrder, settingPages } from "../content/settingPages";

const iconForMoment = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  heart: HeartHandshake,
  landmark: Landmark,
  messages: MessageSquareText,
  presentation: Presentation,
  shield: ShieldCheck,
  users: Users,
};
const iconsForSetting = {
  medical: Stethoscope,
  educational: GraduationCap,
  business: BriefcaseBusiness,
  community: Users,
};
const fadeIn = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function Reveal({ children, className = "", delay = 0, reduceMotion = false }) {
  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={fadeIn}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, description, palette }) {
  return (
    <div className="mb-9 max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black leading-[1.12] tracking-tight md:text-4xl lg:text-5xl" style={{ color: palette.charcoal }}>{title}</h2>
      {description && <p className="mt-4 text-base leading-8" style={{ color: palette.body }}>{description}</p>}
    </div>
  );
}

function SettingNav({ current, palette }) {
  return (
    <nav aria-label="Explore other service settings" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {settingOrder.map((key) => {
        const Icon = iconsForSetting[key];
        const active = key === current;
        return (
          <Link
            key={key}
            to={"/settings/" + key}
            aria-current={active ? "page" : undefined}
            className="group flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-sm font-black shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#dd7d00]"
            style={{
              borderColor: active ? palette.gold : palette.border,
              backgroundColor: active ? "rgba(221,125,0,0.10)" : palette.white,
              color: palette.charcoal
            }}
          >
            <span className="inline-flex items-center gap-3">
              <Icon size={19} style={{ color: palette.gold }} aria-hidden="true" />
              {settingPages[key].label}
            </span>
            {!active && <ArrowRight size={17} className="transition group-hover:translate-x-1" aria-hidden="true" style={{ color: palette.gold }} />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SettingDetail({ palette }) {
  const { settingId } = useParams();
  const reduceMotion = useReducedMotion();
  const setting = settingPages[settingId];
  if (!setting) return <Navigate to="/services" replace />;

  const Icon = iconsForSetting[settingId];
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };
  const brightButton = { backgroundColor: palette.gold, color: "#fff" };

  return (
    <div className="mls-public-site overflow-hidden bg-white">
      <section className="relative isolate px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{
          background: "radial-gradient(circle at 6% 14%, rgba(221,125,0,.14), transparent 29%), radial-gradient(circle at 100% 8%, rgba(114,17,0,.11), transparent 37%), var(--mls-muted-surface)"
        }} />
        <div className="mx-auto max-w-6xl">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#dd7d00]"
            style={{ color: palette.burgundy }}
          >
            <ArrowLeft size={17} /> All services
          </Link>
          <div className="mt-9 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.17em] shadow-sm" style={cardStyle}>
                <Icon size={16} style={{ color: palette.gold }} aria-hidden="true" />
                <span style={{ color: palette.burgundy }}>{setting.eyebrow}</span>
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl md:text-6xl" style={{ color: palette.charcoal }}>
                {setting.headline}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8" style={{ color: palette.body }}>{setting.intro}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="mls-cta-motion inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#dd7d00]" style={brightButton}>
                  Request an interpreter <ArrowRight size={18} />
                </Link>
                <Link to="/services" className="mls-cta-motion inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-black shadow-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#dd7d00]" style={{ borderColor: palette.border, backgroundColor: palette.white, color: palette.charcoal }}>
                  Compare service options
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="relative min-w-0"
            >
              <div className="overflow-hidden rounded-[2rem] border-[5px] shadow-[0_24px_60px_-24px_rgba(70,24,10,.34)]" style={{ borderColor: palette.white, backgroundColor: "#f7f3ef" }}>
                <img className="block aspect-[5/4] w-full object-cover" src={setting.hero} alt={setting.heroAlt} loading="eager" fetchPriority="high" decoding="async" />
              </div>
              <div className="relative z-10 -mt-9 ml-auto w-[90%] rounded-[1.5rem] border border-white/10 bg-[#202020] p-5 text-white shadow-xl md:w-[82%] md:p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em]" style={{ color: "#ffb23f" }}>
                  <CheckCircle2 size={16} /> {setting.promise}
                </div>
                <p className="mt-2 text-base font-semibold leading-7 text-white">{setting.imageCaption}</p>
              </div>
            </motion.div>
          </div>
          <div className="mt-14">
            <SettingNav current={settingId} palette={palette} />
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-9 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <Reveal reduceMotion={reduceMotion}>
            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Why it matters</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>{setting.introTitle}</h2>
            <p className="mt-5 text-base leading-8" style={{ color: palette.body }}>{setting.introBody}</p>
            <Link to="/deaf-and-hard-of-hearing" className="mt-6 inline-flex items-center gap-2 text-sm font-black hover:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dd7d00]" style={{ color: palette.burgundy }}>
              Learn about communication access <ArrowRight size={17} />
            </Link>
          </Reveal>
          <Reveal reduceMotion={reduceMotion} delay={0.08}>
            <div className="rounded-[2rem] border bg-[#202020] p-7 text-white shadow-xl md:p-9">
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "#ffb23f" }}>The MLS approach</p>
              <p className="mt-4 text-2xl font-black leading-snug md:text-3xl">Plan for the interaction, not just the interpreter's arrival.</p>
              <div className="mt-7 space-y-5">
                {[
                  ["01", "People", "Language preferences, participants, and communication goals"],
                  ["02", "Setting", "Room layout, technical demands, timing, and confidentiality"],
                  ["03", "Access", "Interpreter fit, preparation, and an appropriate delivery method"],
                ].map(([number, title, copy]) => (
                  <div key={number} className="flex items-start gap-4 border-t border-white/15 pt-4">
                    <span className="shrink-0 text-sm font-black" style={{ color: "#ffb23f" }}>{number}</span>
                    <div>
                      <h3 className="text-base font-black text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/75">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20" style={{ backgroundColor: "var(--mls-muted-surface)" }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Where access shows up" title={"Real situations in " + setting.label.toLowerCase() + " settings."} description="Select a situation in your mind as you explore these examples—each one has its own communication demands." palette={palette} />
          <div className="grid gap-4 sm:grid-cols-2">
            {setting.moments.map((item, index) => {
              const MomentIcon = iconForMoment[item.icon] || MessageSquareText;
              return (
                <Reveal key={item.title} reduceMotion={reduceMotion} delay={Math.min(index * 0.04, 0.12)}>
                  <div className="group h-full rounded-[1.7rem] border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg md:p-7" style={cardStyle}>
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ color: palette.gold, backgroundColor: "rgba(221,125,0,0.12)" }}>
                      <MomentIcon size={23} aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-black" style={{ color: palette.charcoal }}>{item.title}</h3>
                    <p className="mt-3 text-sm leading-7" style={{ color: palette.body }}>{item.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="What MLS actually does" title="Thoughtful coordination, from first request to assignment." description="Communication access is a process. Here's how MLS supports organizations before the interaction even begins." palette={palette} />
          <div className="grid gap-5 lg:grid-cols-3">
            {setting.supports.map((step, index) => (
              <Reveal reduceMotion={reduceMotion} delay={index * 0.06} key={step.title}>
                <div className="relative h-full overflow-hidden rounded-[1.7rem] border p-7 shadow-sm" style={cardStyle}>
                  <div className="absolute -right-2 -top-8 select-none text-[6.5rem] font-black leading-none opacity-[0.07]" style={{ color: palette.burgundy }} aria-hidden="true">0{index + 1}</div>
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: index === 1 ? palette.burgundy : palette.gold }}>0{index + 1}</div>
                  <h3 className="relative mt-6 text-xl font-black leading-snug" style={{ color: palette.charcoal }}>{step.title}</h3>
                  <p className="relative mt-3 text-sm leading-7" style={{ color: palette.body }}>{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6" style={{ color: palette.body }}>
            Assignment details and availability are reviewed before any interpreter or service format is confirmed.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20" style={{ backgroundColor: "var(--mls-muted-surface)" }}>
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <Reveal reduceMotion={reduceMotion}>
            <div className="h-full rounded-[2rem] bg-[#202020] p-7 text-white shadow-xl md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.17em]" style={{ color: "#ffb23f" }}>{setting.scenario.eyebrow}</p>
              <h2 className="mt-4 text-2xl font-black leading-snug md:text-4xl">{setting.scenario.title}</h2>
              <p className="mt-6 text-base leading-8 text-white/85">{setting.scenario.text}</p>
              <p className="mt-7 border-t border-white/15 pt-4 text-xs leading-6 text-white/60">{setting.scenario.footnote}</p>
            </div>
          </Reveal>
          <Reveal reduceMotion={reduceMotion} delay={0.08}>
            <div className="h-full rounded-[2rem] border p-7 shadow-sm md:p-10" style={cardStyle}>
              <p className="text-xs font-black uppercase tracking-[0.17em]" style={{ color: palette.gold }}>Choose the right format</p>
              <h2 className="mt-3 text-2xl font-black leading-snug md:text-3xl" style={{ color: palette.charcoal }}>On-site or remote? Context decides.</h2>
              <div className="mt-7 space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 shrink-0" style={{ color: palette.gold }} size={23} aria-hidden="true" />
                  <div><h3 className="text-base font-black" style={{ color: palette.charcoal }}>In-person interpreting</h3><p className="mt-2 text-sm leading-7" style={{ color: palette.body }}>{setting.mode.onSite}</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <MonitorPlay className="mt-1 shrink-0" style={{ color: palette.gold }} size={23} aria-hidden="true" />
                  <div><h3 className="text-base font-black" style={{ color: palette.charcoal }}>Video remote interpreting</h3><p className="mt-2 text-sm leading-7" style={{ color: palette.body }}>{setting.mode.vri}</p></div>
                </div>
                <div className="rounded-2xl border-l-4 p-4 text-sm leading-7" style={{ borderColor: palette.gold, backgroundColor: "var(--mls-muted-surface)", color: palette.body }}>{setting.mode.caution}</div>
              </div>
              <Link to="/services" className="mt-7 inline-flex items-center gap-2 text-sm font-black hover:gap-3 focus-visible:outline-2 focus-visible:outline-[#dd7d00]" style={{ color: palette.burgundy }}>Compare delivery options <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Make the request easier" title="Three things to share with MLS." description="You don't need every detail finalized. These basics help us evaluate the request and ask the right follow-up questions." palette={palette} />
          <div className="grid gap-4 md:grid-cols-3">
            {setting.prep.map((item, index) => (
              <Reveal key={item.title} reduceMotion={reduceMotion} delay={index * 0.05}>
                <div className="h-full rounded-[1.6rem] border p-6 shadow-sm" style={cardStyle}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={23} style={{ color: palette.gold }} aria-hidden="true" />
                    <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7" style={{ color: palette.body }}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link to="/contact" className="mls-cta-motion inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black shadow-sm" style={brightButton}>Start your request <ArrowRight size={17} /></Link>
            <Link to="/clients" className="inline-flex items-center gap-2 text-sm font-black" style={{ color: palette.burgundy }}>Client planning guide <FileText size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20" style={{ backgroundColor: "var(--mls-muted-surface)" }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Good questions" title="A few things worth knowing." palette={palette} />
          <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-3">
              {setting.faqs.map(({ question, answer }) => (
                <details key={question} className="group rounded-[1.4rem] border p-5 shadow-sm open:shadow-md" style={cardStyle}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dd7d00] [&::-webkit-details-marker]:hidden" style={{ color: palette.charcoal }}>
                    {question}
                    <ChevronDown size={19} className="mt-0.5 shrink-0 transition group-open:rotate-180" style={{ color: palette.gold }} aria-hidden="true" />
                  </summary>
                  <p className="mt-4 border-t pt-4 text-sm leading-7" style={{ borderColor: palette.border, color: palette.body }}>{answer}</p>
                </details>
              ))}
            </div>
            <div className="rounded-[1.8rem] border p-7 shadow-sm md:p-8" style={cardStyle}>
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                <BookOpen size={27} aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: palette.gold }}>Keep exploring</p>
              <h3 className="mt-3 text-2xl font-black leading-tight" style={{ color: palette.charcoal }}>Practical access guidance, without the jargon.</h3>
              <p className="mt-4 text-sm leading-7" style={{ color: palette.body }}>Our Insights library goes deeper into planning, interpreter fit, and accessible communication.</p>
              <Link to={setting.related.href} className="mt-6 inline-flex items-center gap-2 text-sm font-black hover:gap-3 focus-visible:outline-2 focus-visible:outline-[#dd7d00]" style={{ color: palette.burgundy }}>
                {setting.related.label} <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.2rem] bg-[#202020] p-7 text-white shadow-xl md:p-11">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "#ffb23f" }}>Take the next step</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">Tell us what communication access needs to look like.</h2>
              <p className="mt-4 text-base leading-8 text-white/75">We'll review the details, recommend an appropriate path, and follow up about availability and next steps.</p>
            </div>
            <Link to="/contact" className="mls-cta-motion inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ffb23f]" style={brightButton}>
              Request an interpreter <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-8 border-t border-white/15 pt-7">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.17em]" style={{ color: "#ffb23f" }}>Explore another setting</p>
            <div className="flex flex-wrap gap-3">
              {settingOrder.filter((key) => key !== settingId).map((key) => (
                <Link key={key} to={"/settings/" + key} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-bold text-white transition hover:border-[#ffb23f] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb23f]">
                  {settingPages[key].label} <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
