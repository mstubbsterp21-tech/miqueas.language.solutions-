import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BookOpenCheck, BriefcaseBusiness, ClipboardCheck, FileSearch, Handshake, ShieldCheck, Star } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const standards = [
  { icon: ShieldCheck, title: "Ethics", copy: "Confidentiality, role boundaries, professional conduct, and judgment matter before, during, and after the assignment." },
  { icon: BadgeCheck, title: "Credentials", copy: "MLS reviews certification, EIPA scores, state requirements, documented experience, and verification materials." },
  { icon: BriefcaseBusiness, title: "Fit", copy: "Interpreters are considered according to setting, modality, skill set, experience, and comfort with the assignment demands." },
  { icon: Handshake, title: "Reliability", copy: "Clear communication, timely follow-through, and professional collaboration help build trust with clients and colleagues." },
];

const pathway = [
  "Submit your interpreter network form through Join Our Team.",
  "MLS reviews credentials, experience, modalities, work samples, and areas of practice.",
  "MLS follows up with verification, screening, onboarding steps, or roster placement as appropriate.",
];

const resources = [
  { title: "RID Code of Professional Conduct", href: "https://rid.org/ethics/code-of-professional-conduct/", copy: "Review the core ethical standards that guide professional interpreting practice." },
  { title: "RID Standard Practice Papers", href: "https://rid.org/resources/#spp", copy: "Explore practice guidance for healthcare, legal, education, VRI, teaming, and other settings." },
  { title: "NAIE Code of Ethics", href: "https://naiedu.org/codeofethics/", copy: "Review ethical guidance for interpreters working in K-12 educational environments." },
];

export default function ResourcesInterpreters({ palette }) {
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };
  const goldButton = { backgroundColor: palette.gold, color: palette.white };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 18%, rgba(114,17,0,0.14), transparent 30%), radial-gradient(circle at 88% 12%, rgba(221,125,0,0.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
              <BadgeCheck size={15} style={{ color: palette.gold }} />
              For Interpreters
            </div>
            <h1 className="text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
              A professional network built around standards, fit, and trust.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#555] md:text-xl">
              MLS connects with interpreters who take communication access seriously and understand that good interpreting requires more than availability. It requires preparation, judgment, cultural responsiveness, and professional humility.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/join-our-team" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                Join Our Team
                <ArrowRight size={17} />
              </Link>
              <Link to="/services" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                View MLS Services
              </Link>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55, delay: 0.08 }} className="mt-12 grid gap-4 md:grid-cols-4">
            {["Credential review", "Screening", "Roster fit", "Assignment matching"].map((item, index) => (
              <div key={item} className="rounded-[1.5rem] border bg-white/85 p-5 text-center shadow-sm backdrop-blur" style={{ borderColor: palette.border }}>
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: index % 2 === 0 ? palette.gold : palette.burgundy }}>
                  {index + 1}
                </div>
                <p className="text-sm font-black" style={{ color: palette.charcoal }}>{item}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[2.2rem] border shadow-lg" style={{ borderColor: palette.border }}>
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="bg-[#202020] p-7 md:p-9">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: palette.gold }}>
                  <BadgeCheck size={14} /> Interpreter portal
                </div>
                <h2 className="text-3xl font-black leading-tight text-white md:text-5xl">Returning Interpreter?</h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
                  Already connected with MLS or finishing onboarding? Use the interpreter portal to review your profile, track document needs, and keep your availability and rate details current.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a href="/login.html" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                    Interpreter Login
                    <ArrowRight size={17} />
                  </a>
                  <Link to="/join-our-team" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                    New to MLS? Apply here
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 bg-white p-7 md:p-9">
                <div className="rounded-[1.5rem] border p-5" style={cardStyle}>
                  <FileSearch size={24} style={{ color: palette.gold }} />
                  <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>Check onboarding items</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">See what MLS still needs, including credentials, W-9, insurance, résumé, screening, or profile updates.</p>
                </div>
                <div className="rounded-[1.5rem] border p-5" style={cardStyle}>
                  <ClipboardCheck size={24} style={{ color: palette.gold }} />
                  <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>Keep your details fresh</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">Update availability windows, assignment preferences, service areas, rates, and contact information as your schedule changes.</p>
                </div>
                <p className="text-xs font-medium leading-6 text-[#777]">Portal access is intended for invited or returning interpreters only.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2.2rem] border bg-[#202020] p-7 shadow-sm md:p-9" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>MLS standards</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">The roster is not just a list. It is a professional responsibility.</h2>
              <p className="mt-5 text-base leading-8 text-white/75">
                MLS is responsible for matching client needs with interpreters who are prepared for the setting. That means looking at skill, credentials, judgment, experience, boundaries, and the interpreter’s own stated areas of readiness.
              </p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {standards.map(({ icon: Icon, title, copy }, index) => (
                <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                  <Icon size={24} style={{ color: palette.gold }} />
                  <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="sticky top-32 rounded-[2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Pathway</p>
              <h2 className="mt-3 text-3xl font-black leading-tight" style={{ color: palette.charcoal }}>How joining works.</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">The application form stays on the Join Our Team page. This page is for expectations, standards, and professional resources.</p>
            </motion.div>
            <div className="relative">
              <div className="absolute left-6 top-0 hidden h-full w-px bg-black/10 md:block" />
              <div className="space-y-5">
                {pathway.map((step, index) => (
                  <motion.div key={step} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="relative rounded-[1.6rem] border bg-white p-6 shadow-sm md:ml-16" style={cardStyle}>
                    <div className="absolute -left-[4.1rem] top-6 hidden h-12 w-12 items-center justify-center rounded-full border-4 border-white text-lg font-black text-white shadow-md md:flex" style={{ backgroundColor: palette.burgundy }}>{index + 1}</div>
                    <p className="text-base font-bold leading-8" style={{ color: palette.charcoal }}>{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Professional resources</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Standards that support stronger practice.</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {resources.map((resource, index) => (
              <motion.a key={resource.title} href={resource.href} target="_blank" rel="noreferrer" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="group rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                  <BookOpenCheck size={23} />
                </div>
                <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{resource.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{resource.copy}</p>
              </motion.a>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mt-10 overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
            <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
              <div className="bg-[#202020] p-7 md:p-9">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: palette.gold }}>
                  <Star size={14} /> Professional fit matters
                </div>
                <p className="text-sm font-semibold leading-7 text-white/70">“MLS is looking for interpreters who value accuracy, judgment, humility, and steady professional growth.”</p>
              </div>
              <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[320px] md:p-9">
                <p className="text-sm leading-6 text-[#5f6368]">Interested in being considered for MLS assignments?</p>
                <Link to="/join-our-team" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Join Our Team <ArrowRight size={17} /></Link>
                <p className="text-xs font-medium text-[#777]">Application form only available through Join Our Team</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
