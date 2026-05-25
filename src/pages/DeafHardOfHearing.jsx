import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, BriefcaseBusiness, Building2, CheckCircle2, Ear, FileText, GraduationCap, HandHeart, HeartHandshake, MessageCircle, ShieldCheck, Stethoscope, Users } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const situations = [
  { icon: Stethoscope, title: "Medical appointments", copy: "Appointments, intake, discharge instructions, therapy, specialist visits, and care planning conversations." },
  { icon: GraduationCap, title: "School meetings", copy: "IEP meetings, parent conferences, classroom access, trainings, and educational programs." },
  { icon: BriefcaseBusiness, title: "Employment", copy: "Interviews, staff meetings, onboarding, trainings, workplace discussions, and performance conversations." },
  { icon: Building2, title: "Public services", copy: "Government offices, community programs, public meetings, legal-adjacent services, and service appointments." },
];

const advocacyPhrases = [
  "I use ASL and need a qualified interpreter for effective communication.",
  "Please confirm who is coordinating accessibility for this appointment.",
  "I need communication access before I can fully participate or make decisions.",
  "Can you provide the interpreter’s name, modality, and whether this will be on-site or remote?",
];

const interpreterTips = [
  { icon: CheckCircle2, title: "Speak for yourself", copy: "The interpreter relays the message, but your questions, decisions, and comments are still yours." },
  { icon: Ear, title: "Pause when needed", copy: "When something is unclear, you can pause and ask for clarification, repetition, or a better setup." },
  { icon: FileText, title: "Share context", copy: "Names, topics, documents, agendas, or technical terms can help improve accuracy and flow." },
];

const resources = [
  { title: "ADA Effective Communication", href: "https://www.ada.gov/resources/effective-communication/", copy: "Learn about effective communication responsibilities under the ADA." },
  { title: "National Association of the Deaf", href: "https://www.nad.org/resources/", copy: "Explore advocacy information, legal resources, and community guidance." },
  { title: "ADA Information Line", href: "https://www.ada.gov/infoline/", copy: "Find official ADA contact information and guidance from the Department of Justice." },
];

export default function DeafHardOfHearing({ palette }) {
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };
  const goldButton = { backgroundColor: palette.gold, color: palette.white };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 16%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 92% 12%, rgba(114,17,0,0.14), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
                <HandHeart size={15} style={{ color: palette.gold }} />
                Deaf & Hard of Hearing
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Know your access options. Use your voice with confidence.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                This page is built as an advocacy hub for Deaf, DeafBlind, hard-of-hearing, late-deafened, and hearing community members who want clearer communication access and practical tools for requesting support.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                  Request Support
                  <ArrowRight size={17} />
                </Link>
                <Link to="/clients" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                  Client Access Information
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-7 -top-7 h-32 w-32 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="absolute -bottom-7 -left-7 h-28 w-28 rounded-full opacity-80" style={{ backgroundColor: palette.gold }} />
              <div className="relative rounded-[2.2rem] border bg-white p-5 shadow-2xl" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#202020] p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Self-advocacy toolkit</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight">Clear phrases can make access requests easier.</h2>
                  <div className="mt-6 space-y-3">
                    {advocacyPhrases.slice(0, 3).map((phrase) => (
                      <div key={phrase} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold leading-6 text-white/85">
                        “{phrase}”
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.5rem] border bg-[#f7f3ef] p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Access reminder</p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>Being present is not the same as being able to participate.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2.2rem] border bg-[#202020] p-7 shadow-sm md:p-10" style={{ borderColor: palette.border }}>
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Rights & access</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">Communication access is not a favor.</h2>
                <p className="mt-5 text-base leading-8 text-white/75">
                  In many settings, organizations may be responsible for providing effective communication. A qualified interpreter can help make sure you are not just present, but actually able to understand, respond, ask questions, and make informed decisions.
                </p>
              </div>
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, title: "Understand", copy: "You should be able to understand important information clearly." },
                  { icon: MessageCircle, title: "Respond", copy: "You should be able to ask questions and express your own thoughts." },
                  { icon: Users, title: "Participate", copy: "You should be included in the actual conversation, not left on the side." },
                  { icon: HeartHandshake, title: "Be respected", copy: "Access should support dignity, privacy, and meaningful involvement." },
                ].map(({ icon: Icon, title, copy }, index) => (
                  <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="h-full rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                    <Icon size={23} style={{ color: palette.gold }} />
                    <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{copy}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Common situations</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Access may be needed in more places than people realize.</h2>
          </motion.div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {situations.map(({ icon: Icon, title, copy }, index) => (
              <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="h-full rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}><Icon size={22} /></div>
                <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Self-advocacy phrases</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>Words you can use when requesting access.</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">Sometimes the hardest part is knowing how to ask. These phrases can be adapted for email, phone calls, portals, or in-person conversations.</p>
            </motion.div>
            <div className="space-y-4">
              {advocacyPhrases.map((phrase, index) => (
                <motion.div key={phrase} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-5 shadow-sm" style={cardStyle}>
                  <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: palette.gold }}>Phrase {index + 1}</p>
                  <p className="mt-2 text-base font-bold leading-8" style={{ color: palette.charcoal }}>“{phrase}”</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
            <div>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Working with interpreters</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>The interpreter supports communication. They do not replace your voice.</h2>
              </motion.div>
              <div className="grid auto-rows-fr gap-4 md:grid-cols-3 lg:grid-cols-1">
                {interpreterTips.map(({ icon: Icon, title, copy }, index) => (
                  <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="h-full rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                    <Icon size={23} style={{ color: palette.gold }} />
                    <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2rem] border bg-[#f7f3ef] p-6 md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>For hearing allies</p>
              <h3 className="mt-3 text-3xl font-black leading-tight" style={{ color: palette.charcoal }}>Access works better when hearing people understand their role too.</h3>
              <div className="mt-6 space-y-3">
                {[
                  "Speak directly to the Deaf person, not to the interpreter.",
                  "Do not ask the interpreter to explain, decide, or speak on behalf of the Deaf person.",
                  "Allow time for interpretation before expecting a response.",
                  "Share materials ahead of time when possible.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <CheckCircle2 size={18} style={{ color: palette.gold, marginTop: 2, flexShrink: 0 }} />
                    <span className="text-sm leading-6" style={{ color: palette.body }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Helpful resources</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Learn more about communication access and advocacy.</h2>
          </motion.div>
          <div className="grid auto-rows-fr gap-4 md:grid-cols-3">
            {resources.map((resource, index) => (
              <motion.a key={resource.title} href={resource.href} target="_blank" rel="noreferrer" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="h-full rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <BookOpenCheck size={23} style={{ color: palette.gold }} />
                <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>{resource.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{resource.copy}</p>
              </motion.a>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mt-10 overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
            <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
              <div className="bg-[#202020] p-7 md:p-9">
                <p className="text-sm font-semibold leading-7 text-white/70">“Access should allow people to understand and be understood — not just be physically present in the room.”</p>
              </div>
              <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[320px] md:p-9">
                <p className="text-sm leading-6 text-[#5f6368]">Need help requesting or coordinating ASL interpreting services?</p>
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request Support <ArrowRight size={17} /></Link>
                <p className="text-xs font-medium text-[#777]">MLS can help clarify next steps</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
