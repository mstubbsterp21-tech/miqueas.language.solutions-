import React, { useMemo, useState } from "react";
import logo from "./logo.png";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight, HeartHandshake, Globe, Video, Stethoscope, GraduationCap, Ship, Users, Mail, CheckCircle2, ShieldCheck, Clock3 } from "lucide-react";

const palette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
};

const navItems = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "resources", label: "Resources" },
  { id: "contact", label: "Contact" },
];

const serviceCards = [
  {
    icon: Users,
    title: "In-Person Interpreting",
    text:
      "Professional ASL interpreting services for on-site assignments across a variety of settings.",
  },
  {
    icon: Video,
    title: "Video Remote Interpreting",
    text:
      "Reliable interpreting for virtual meetings, appointments, and remote communication needs.",
  },
  {
    icon: Globe,
    title: "English → ASL Translation (Video)",
    text:
      "Recorded video translations from English into ASL for accessible communication.",
  },
  {
    icon: Globe,
    title: "ASL → English Translation",
    text:
      "Captioned video or written/spoken transcription of ASL content into English.",
  },
];

const specialtyCards = [
  { icon: Stethoscope, title: "Medical" },
  { icon: GraduationCap, title: "Educational" },
  { icon: Ship, title: "Cruise" },
  { icon: Users, title: "Community" },
];

const values = [
  {
    title: "Professional standards",
    text:
      "Assignments are approached with professionalism, preparation, and respect for client needs.",
    icon: ShieldCheck,
  },
  {
    title: "Personalized service",
    text:
      "You are not treated like a number. Each inquiry is handled with care, communication, and attention to detail.",
    icon: HeartHandshake,
  },
  {
    title: "Clear coordination",
    text:
      "From intake to assignment planning, the goal is to make the process feel simple, responsive, and dependable.",
    icon: Clock3,
  },
];

const faqs = [
  {
    q: "Do you publish rates online?",
    a:
      "Rates and policies are provided privately based on the details of the request. This helps ensure each quote reflects the assignment accurately.",
  },
  {
    q: "Do you accept travel assignments?",
    a:
      "Yes. Travel is considered case by case. Miqueas Language Solutions is based in Ocala, Florida, and remote services are also available.",
  },
  {
    q: "What types of settings are supported?",
    a:
      "Current specialties include medical, educational, cruise, and community assignments, with experience across both remote and in-person environments.",
  },
];

function Button({ children, href = "#contact", variant = "primary", className = "" }) {
  const isPrimary = variant === "primary";

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90 ${className}`}
      style={
        isPrimary
          ? { backgroundColor: palette.burgundy, color: "#ffffff" }
          : {
              backgroundColor: "#ffffff",
              color: palette.charcoal,
              border: `1px solid ${palette.charcoal}`,
            }
      }
    >
      {children}
    </a>
  );
}

function Section({ id, eyebrow, title, subtitle, children, className = "" }) {
  return (
    <section id={id} className={`scroll-mt-28 px-5 md:px-8 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || subtitle) && (
          <div className="mb-10 max-w-3xl">
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h2>}
            {subtitle && <p className="mt-4 text-base leading-7 text-slate-700 md:text-lg">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

function BrandLockup({ showTagline = true }) {
  return (
    <>
      <img src={logo} alt="logo" className="h-24 w-auto object-contain" />
      <div className="min-w-0">
        <div className="text-lg font-bold tracking-tight" style={{ color: palette.charcoal }}>
          Miqueas Language Solutions
        </div>
        {showTagline && (
          <div className="text-sm" style={{ color: palette.burgundy }}>
            Bridging Perspectives. Delivering Understanding.
          </div>
        )}
      </div>
    </>
  );
}

export default function MiqueasLanguageSolutionsWebsite() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
    <a href="#home" className="flex min-w-0 items-center gap-3">
      <BrandLockup />
    </a>

    <nav className="hidden items-center gap-6 md:flex">
      {navItems.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="text-sm font-medium transition hover:opacity-70"
          style={{ color: palette.charcoal }}
        >
          {item.label}
        </a>
      ))}

      <div className="ml-4 flex items-center gap-3">
        <a
          href="https://www.instagram.com/miqueas.language.solutions/"
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-3 py-2 text-xs font-semibold transition hover:opacity-80"
          style={{ backgroundColor: palette.gold, color: "#ffffff" }}
        >
          IG
        </a>
      </div>

      <Button href="#contact">Request a Quote</Button>
    </nav>

    <button
      className="rounded-xl p-2 md:hidden"
      onClick={() => setMobileOpen((value) => !value)}
      aria-label="Toggle menu"
      aria-expanded={mobileOpen}
      aria-controls="mobile-navigation"
      type="button"
    >
      {mobileOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  </div>

  {mobileOpen && (
    <div id="mobile-navigation" className="border-t border-black/5 bg-white md:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-black/5"
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <a
          href="#contact"
          className="mt-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
          style={{ backgroundColor: palette.burgundy }}
          onClick={() => setMobileOpen(false)}
        >
          Request a Quote
        </a>
      </div>
    </div>
  )}
</header>

      <main>
        <Section id="home" className="pb-20 pt-10 md:pb-28 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-slate-700">
                <CheckCircle2 size={16} style={{ color: palette.gold }} />
                Based in Ocala, FL • Travel & remote services available
              </div>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
                Language access that feels professional, personal, and dependable.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
                Miqueas Language Solutions provides ASL ↔ English interpreting and ASL video translation services with the care, responsiveness, and professionalism clients deserve.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="#contact">
                  Request a Quote <ArrowRight size={16} />
                </Button>
                <Button href="#services" variant="secondary">
                  Explore Services
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["7 years", "Professional interpreting experience"],
                  ["EIPA + Pre-Certified", "NIC performance exam in progress"],
                  ["Medical • Educational • Cruise • Community", "Current specialty settings"],
                ].map(([stat, label]) => (
                  <div key={stat} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                    <div className="text-lg font-bold" style={{ color: palette.burgundy }}>
                      {stat}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="relative"
            >
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full opacity-60 blur-2xl" style={{ backgroundColor: palette.softGray }} />
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-60 blur-2xl" style={{ backgroundColor: palette.softGray }} />

              <div className="relative overflow-hidden rounded-[2rem] border border-black/5 shadow-xl">
                <div className="px-8 py-8" style={{ backgroundColor: palette.softGray }}>
                  <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: palette.gold }}>
                          Why clients choose us
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">A better fit than a robotic experience</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        "Professional communication from inquiry to assignment",
                        "Services tailored to the actual needs of the client and consumers",
                        "A people-first approach that values clarity, responsiveness, and care",
                      ].map((point) => (
                        <div key={point} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: palette.burgundy }} />
                          <p className="text-sm leading-6 text-slate-700">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Section>

        <Section
          id="services"
          eyebrow="Services"
          title="Practical language support across remote and in-person settings"
          subtitle="Whether the need is virtual, on-site, or recorded, services are designed to make communication access feel smoother, more human, and more dependable."
          className="bg-slate-50 py-20 md:py-24"
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: palette.softGray }}>
                    <Icon size={22} style={{ color: palette.burgundy }} />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                Specialties
              </p>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">Focused experience where accuracy and trust matter most</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {specialtyCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor:  palette.softGray}}>
                        <Icon size={20} style={{ color: palette.burgundy }} />
                      </div>
                      <span className="font-medium text-slate-800">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] p-7 shadow-sm" style={{ backgroundColor: palette.charcoal }}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Service approach</p>
              <h3 className="mt-3 text-2xl font-bold text-white">Built for clients who want more than just coverage</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
                Miqueas Language Solutions is designed for clients who want professional support without feeling shuffled through a generic system. Every inquiry is handled with attention to logistics, communication needs, and assignment fit.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Quotes provided based on assignment details",
                  "Rates and policies shared privately upon inquiry",
                  "Travel considered case by case from Ocala, Florida",
                  "Remote services available for qualifying requests",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white" />
                    <span className="text-sm leading-6 text-white/85">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="about"
          eyebrow="About"
          title="A company rooted in skill, growth, and real community connection"
          subtitle="Miqueas Language Solutions was built to offer clients the kind of professional support that still feels human. The goal is simple: provide language access with care, clarity, and strong attention to the people involved."
          className="py-20 md:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">Our story</h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700 md:text-base">
                <p>
                  The work behind Miqueas Language Solutions grew out of years of language development, community connection, and professional interpreting experience. After beginning ASL study in 2013 and entering the field professionally in 2019, the mission became clearer with time: help reduce communication barriers and support more equitable access between Deaf and hearing worlds.
                </p>
                <p>
                  Today, that mission shows up through dependable service, ongoing growth, and a commitment to meeting clients and consumers with respect. The result is a business that values both professional standards and genuine care.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-black/5 p-7 shadow-sm" style={{ backgroundColor: palette.softGray }}>
                <h3 className="text-2xl font-bold text-slate-900">Credentials & experience</h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["EIPA", "Educational Interpreter Performance Assessment"],
                    ["Pre-Certified (NIC)", "Written exam passed; performance exam in progress"],
                    ["7 Years", "Professional interpreting experience"],
                    ["Remote + On-Site", "Experience across VRI and in-person settings"],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="font-semibold" style={{ color: palette.burgundy }}>
                        {title}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">{body}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900">Why this company stands out</h3>
                <div className="mt-5 grid gap-4">
                  {values.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: palette.softGray }}>
                          <Icon size={20} style={{ color: palette.burgundy }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-black/5 bg-slate-50 p-7 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  Professional reputation
                </p>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">Trusted by mentors and colleagues</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Professional and competent, with strong teamwork and receptiveness to feedback.",
                  "Highly intelligent, motivated, and skilled, while remaining respectful of professional boundaries.",
                ].map((quote) => (
                  <div key={quote} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    <p className="text-sm leading-7 text-slate-700">“{quote}”</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="resources"
          eyebrow="Resources"
          title="Working With an ASL Interpreter"
          subtitle="Practical guidance for creating clear, effective, and accessible communication."
          className="py-20 md:py-24"
        >
          <div className="grid gap-8">
            <div
              className="rounded-[2rem] border p-8 shadow-sm"
              style={{ backgroundColor: palette.white, borderColor: palette.border }}
            >
              <h3 className="text-2xl font-bold" style={{ color: palette.charcoal }}>
                Why this matters
              </h3>
              <div className="mt-5 space-y-4 text-sm leading-7 md:text-base" style={{ color: "#5f5f5f" }}>
                <p>
                  Clear communication is not just about exchanging words. It is about making sure everyone involved fully understands and is understood.
                </p>
                <p>
                  When working with Deaf individuals who use American Sign Language, providing a qualified interpreter helps create direct, meaningful communication. It allows all parties to participate fully, ask questions, and make informed decisions without barriers.
                </p>
                <p>
                  Miqueas Language Solutions exists to support that process by bridging communication between different worldviews with professionalism, clarity, and care.
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div
                className="rounded-[2rem] border p-8 shadow-sm"
                style={{ backgroundColor: palette.softGray, borderColor: palette.border }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  When an interpreter is needed
                </p>
                <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
                  Common situations where language access matters
                </h3>
                <div className="mt-6 grid gap-3">
                  {[
                    "Medical appointments and consultations",
                    "Educational settings, meetings, and evaluations",
                    "Workplace communication, interviews, and trainings",
                    "Community interactions and public services",
                    "Virtual appointments and remote communication",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: palette.burgundy }} />
                      <p className="text-sm leading-6" style={{ color: "#5f5f5f" }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-[2rem] border p-8 shadow-sm"
                style={{ backgroundColor: palette.white, borderColor: palette.border }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  ASL is not English
                </p>
                <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
                  Why professional interpreting matters
                </h3>
                <div className="mt-5 space-y-4 text-sm leading-7 md:text-base" style={{ color: "#5f5f5f" }}>
                  <p>
                    American Sign Language is a complete, natural language with its own grammar, structure, and cultural context. It is not simply a signed version of English.
                  </p>
                  <p>
                    Because of this, direct word-for-word translation is not always possible. Skilled interpreters focus on conveying meaning, intent, and tone so communication stays accurate and natural.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div
                className="rounded-[2rem] border p-8 shadow-sm"
                style={{ backgroundColor: palette.white, borderColor: palette.border }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  Captions vs. interpreting
                </p>
                <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
                  Why captions are not always enough
                </h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl p-5" style={{ backgroundColor: palette.softGray }}>
                    <h4 className="font-semibold" style={{ color: palette.charcoal }}>Captions</h4>
                    <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "#5f5f5f" }}>
                      <li>Rely on reading speed and literacy</li>
                      <li>May miss nuance, tone, or intent</li>
                      <li>Can lag or contain errors</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl p-5" style={{ backgroundColor: palette.softGray }}>
                    <h4 className="font-semibold" style={{ color: palette.charcoal }}>ASL Interpreting</h4>
                    <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "#5f5f5f" }}>
                      <li>Provides real-time natural language access</li>
                      <li>Reflects tone, intent, and meaning</li>
                      <li>Allows for interaction and clarification</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[2rem] border p-8 shadow-sm"
                style={{ backgroundColor: palette.charcoal, borderColor: palette.charcoal }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  Best practices
                </p>
                <h3 className="mt-3 text-2xl font-bold text-white">
                  How to work effectively with an interpreter
                </h3>
                <div className="mt-6 space-y-3">
                  {[
                    "Speak directly to the Deaf individual, not the interpreter.",
                    "Maintain natural pacing and avoid rushing through information.",
                    "Allow time for interpretation before expecting a response.",
                    "Provide materials in advance whenever possible.",
                    "Be open to clarification if something is unclear.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: palette.gold }} />
                      <p className="text-sm leading-6 text-white/85">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div
                className="rounded-[2rem] border p-8 shadow-sm"
                style={{ backgroundColor: palette.softGray, borderColor: palette.border }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  Additional support
                </p>
                <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
                  Some situations require more than one interpreter
                </h3>
                <div className="mt-5 space-y-4 text-sm leading-7 md:text-base" style={{ color: "#5f5f5f" }}>
                  <p>
                    Some assignments may require team interpreting or a Deaf interpreter, depending on the length, complexity, and communication needs involved.
                  </p>
                  <p>
                    These decisions are made based on the specific demands of the assignment to support the highest level of communication access.
                  </p>
                </div>
              </div>

              <div
                className="rounded-[2rem] border p-8 shadow-sm"
                style={{ backgroundColor: palette.softGray, borderColor: palette.border }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  Need help deciding?
                </p>
                <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
                  You do not have to figure it all out on your own
                </h3>
                <div className="mt-5 space-y-4 text-sm leading-7 md:text-base" style={{ color: "#5f5f5f" }}>
                  <p>
                    If you are unsure whether an interpreter is needed or what type of service would be the best fit, that is okay. Part of the process is helping clients identify the most appropriate support.
                  </p>
                  <p>
                    Miqueas Language Solutions can help guide that decision and ensure the right communication access is in place.
                  </p>
                </div>
                <div className="mt-6">
                  <Button href="#contact">
                    Request a Quote <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="contact"
          eyebrow="Contact"
          title="Request a quote"
          subtitle="Share a few details about your assignment. A response can then be tailored to your setting, timeline, and communication needs."
          className="bg-slate-50 py-20 md:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">What to expect</h3>
              <div className="mt-5 space-y-4">
                {[
                  "Submit the inquiry form with assignment details.",
                  "Receive a customized response based on service type, setting, and logistics.",
                  "If the request is a fit, next steps for scheduling and coordination will follow.",
                ].map((step, idx) => (
                  <div key={step} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: palette.burgundy }}
                    >
                      {idx + 1}
                    </div>
                    <p className="pt-1 text-sm leading-6 text-slate-700">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl p-5" style={{ backgroundColor:  palette.softGray}}>
                <div className="flex items-center gap-3">
                  <Mail size={20} style={{ color: palette.burgundy }} />
                  <div>
                    <p className="font-semibold text-slate-900">Contact Miqueas Language Solutions</p>
                    <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                      <p>
                        <a href="mailto:mstubbsterp21@gmail.com" className="hover:text-slate-900">
                          mstubbsterp21@gmail.com
                        </a>
                      </p>
                      <p>(352) 396-8098</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm">
              <div className="mb-5 rounded-2xl border border-black/5 p-4" style={{ backgroundColor: palette.softGray }}>
                <p className="text-sm leading-6 text-slate-700">
                  If the embedded form does not load in preview, use the button below to open the quote request form directly in a new tab.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSepJCbUYpT114I1xcH4TWC20wrLdHSc62SFnRJUPQalsAzbfw/viewform"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    style={{ backgroundColor: palette.burgundy }}
                  >
                    Open Form in New Tab <ArrowRight size={16} />
                  </a>
                </div>
              </div>

              <iframe
                title="Miqueas Language Solutions quote request form"
                src="https://docs.google.com/forms/d/e/1FAIpQLSepJCbUYpT114I1xcH4TWC20wrLdHSc62SFnRJUPQalsAzbfw/viewform?embedded=true"
                width="100%"
                height="1521"
                frameBorder="0"
                marginHeight="0"
                marginWidth="0"
                className="rounded-2xl"
                style={{ border: "0" }}
              >
                Loading…
              </iframe>
            </div>
          </div>
        </Section>

        <Section
          eyebrow="FAQ"
          title="Common questions"
          subtitle="A few quick answers for clients considering services through Miqueas Language Solutions."
          className="py-20 md:py-24"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <footer className="border-t border-black/5 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandLockup showTagline={false} />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <a href="#home" className="hover:text-slate-900">
              Home
            </a>
            <a href="#services" className="hover:text-slate-900">
              Services
            </a>
            <a href="#about" className="hover:text-slate-900">
              About
            </a>
            <a href="#contact" className="hover:text-slate-900">
              Contact
            </a>
          </div>

          <div className="text-sm text-slate-500">© {year} Miqueas Language Solutions. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
