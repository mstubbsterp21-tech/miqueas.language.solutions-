import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, ClipboardList, FileText, HeartHandshake, ShieldCheck, Users } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const clientCards = [
  { icon: Building2, title: "Businesses & organizations", copy: "Support for meetings, trainings, programs, consultations, events, and public-facing services." },
  { icon: HeartHandshake, title: "Healthcare & human services", copy: "Clear communication access during appointments, intake, follow-ups, and care-related conversations." },
  { icon: Users, title: "Education & community settings", copy: "Interpreting support for schools, programs, workshops, family meetings, and community events." },
  { icon: ShieldCheck, title: "Professional coordination", copy: "Each request is reviewed for setting, timing, communication needs, interpreter fit, and preparation materials." },
];

const processSteps = [
  "Share the setting, date, location, and communication needs.",
  "MLS reviews the assignment for fit, logistics, and interpreter availability.",
  "You receive clear next steps so the assignment can move forward smoothly.",
];

const resourceLinks = [
  { title: "ADA Effective Communication", href: "https://www.ada.gov/resources/effective-communication/", copy: "Learn how effective communication applies to public accommodations and service providers." },
  { title: "ADA Requirements", href: "https://www.ada.gov/law-and-regs/ada/", copy: "Review federal accessibility requirements and nondiscrimination standards." },
  { title: "IDEA", href: "https://sites.ed.gov/idea/statute-chapter-33/subchapter-ii", copy: "Explore educational access requirements and protections for students with disabilities." },
];

export default function ResourcesClients({ palette }) {
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };
  const goldButton = { backgroundColor: palette.gold, color: palette.white };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(114,17,0,0.12), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_390px]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
                <ClipboardList size={15} style={{ color: palette.gold }} />
                For Clients
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Request interpreting services with clarity and confidence.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                Whether you are coordinating a medical appointment, school meeting, business event, or community service, MLS helps you plan for communication access with professionalism and care.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                  Request an Interpreter
                  <ArrowRight size={17} />
                </Link>
                <Link to="/services" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                  View Services
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["On-site & remote options", "ASL/English interpreting", "Clear next steps"].map((item) => (
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
                    {["Who will be present?", "What is the setting?", "What materials help preparation?"].map((item, index) => (
                      <div key={item} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: palette.border }}>
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: index === 1 ? palette.burgundy : palette.gold }}>
                          {index + 1}
                        </div>
                        <p className="text-sm font-bold leading-6" style={{ color: palette.charcoal }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.5rem] border bg-white p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Client focus</p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>Access works best when it is planned thoughtfully.</p>
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
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Why it matters</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">Language access helps everyone participate with understanding.</h2>
              <p className="mt-5 text-base leading-8 text-white/75">
                A qualified interpreter helps preserve meaning, tone, and intent so Deaf and hearing participants can engage in the same conversation with fewer barriers and less confusion.
              </p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {clientCards.map(({ icon: Icon, title, copy }, index) => (
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
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>The process</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>A smoother request starts with the right details.</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">You do not need to know every answer before reaching out. Share what you have, and MLS will help identify what else may be needed.</p>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {processSteps.map((step, index) => (
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
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Helpful guidance</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Know the basics before the assignment begins.</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {resourceLinks.map((resource, index) => (
              <motion.a key={resource.title} href={resource.href} target="_blank" rel="noreferrer" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <FileText size={23} style={{ color: palette.gold }} />
                <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>{resource.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{resource.copy}</p>
              </motion.a>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mt-10 overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
            <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
              <div className="bg-[#202020] p-7 md:p-9">
                <p className="text-sm font-semibold leading-7 text-white/70">“Good access does not happen by accident. The right preparation helps the interaction feel clear, respectful, and natural.”</p>
              </div>
              <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[320px] md:p-9">
                <p className="text-sm leading-6 text-[#5f6368]">Ready to request interpreting services?</p>
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request an Interpreter <ArrowRight size={17} /></Link>
                <p className="text-xs font-medium text-[#777]">No commitment required • Clear follow-up</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
