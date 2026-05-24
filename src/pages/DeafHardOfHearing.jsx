import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, CheckCircle2, Ear, Eye, FileText, HandHeart, HeartHandshake, MessageCircle, ShieldCheck, Users } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const accessCards = [
  { icon: ShieldCheck, title: "Communication rights", copy: "You deserve communication access that lets you understand, participate, ask questions, and make informed decisions." },
  { icon: MessageCircle, title: "Interpreter requests", copy: "It is appropriate to request a qualified interpreter when communication depends on clear, complete understanding." },
  { icon: HeartHandshake, title: "Respectful interaction", copy: "Interpreters support communication between people. The conversation still belongs to you and the hearing participant." },
  { icon: Users, title: "Family and community", copy: "Hearing family members, organizations, and service providers also benefit from understanding how access works." },
];

const requestSteps = [
  "Tell the organization that you use ASL or need communication access.",
  "Ask for a qualified interpreter or appropriate communication support for the setting.",
  "Share details like date, time, location, topic, and whether the appointment is on-site or remote.",
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
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(114,17,0,0.12), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)",
          }}
        />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_390px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
                <HandHeart size={15} style={{ color: palette.gold }} />
                Deaf & Hard of Hearing
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Communication access should feel clear, respectful, and usable.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                This page is for Deaf, DeafBlind, hard-of-hearing, late-deafened, and hearing community members who want to better understand interpreter access, communication rights, and how to work with interpreters effectively.
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
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Know your rights", "Request access", "Work with interpreters"].map((item) => (
                  <div key={item} className="rounded-2xl border bg-white/80 px-4 py-4 text-sm font-semibold shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.charcoal }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[390px]">
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full opacity-90" style={{ backgroundColor: palette.gold }} />
              <div className="absolute -bottom-6 -right-6 h-36 w-36 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="relative rounded-[2.2rem] border bg-white p-5 shadow-2xl" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#f7f3ef] p-6">
                  <div className="grid gap-4">
                    {[
                      { label: "Access", icon: Eye },
                      { label: "Understanding", icon: MessageCircle },
                      { label: "Participation", icon: Users },
                    ].map(({ label, icon: Icon }, index) => (
                      <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: palette.border }}>
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: index === 1 ? palette.burgundy : palette.gold }}>
                          <Icon size={20} />
                        </div>
                        <p className="text-sm font-bold leading-6" style={{ color: palette.charcoal }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.5rem] border bg-white p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Community focus</p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>Access is about being able to fully participate.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2rem] border bg-[#202020] p-7 shadow-sm md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Equal access</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">Communication access is not a favor. It is part of meaningful participation.</h2>
              <p className="mt-5 text-base leading-8 text-white/75">
                In many settings, especially healthcare, education, employment, public services, and businesses open to the public, organizations may be responsible for providing effective communication. A qualified interpreter can help make that access real.
              </p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {accessCards.map(({ icon: Icon, title, copy }, index) => (
                <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}><Icon size={22} /></div>
                  <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Requesting access</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>A clear request helps organizations understand what you need.</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">You do not need to explain everything perfectly. Start by naming the access need and giving practical details about the appointment, meeting, event, or service.</p>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {requestSteps.map((step, index) => (
                <motion.div key={step} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-6 text-center shadow-sm" style={cardStyle}>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white" style={{ backgroundColor: palette.burgundy }}>{index + 1}</div>
                  <p className="text-sm font-bold leading-7" style={{ color: palette.charcoal }}>{step}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Working with interpreters</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>The interpreter is there to support communication, not replace your voice.</h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: CheckCircle2, title: "Speak for yourself", copy: "The interpreter relays the message, but your questions, decisions, and comments are still yours." },
              { icon: Ear, title: "Ask for clarification", copy: "When something is unclear, you can pause and ask for clarification or repetition." },
              { icon: FileText, title: "Share context", copy: "Names, topics, documents, agendas, or technical terms can help improve accuracy and flow." },
            ].map(({ icon: Icon, title, copy }, index) => (
              <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <Icon size={23} style={{ color: palette.gold }} />
                <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Helpful resources</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Learn more about communication access and advocacy.</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {resources.map((resource, index) => (
              <motion.a key={resource.title} href={resource.href} target="_blank" rel="noreferrer" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
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
