import InterpreterRequestForm from "../components/InterpreterRequestForm";
import { motion } from "framer-motion";
import { CalendarCheck2, ClipboardList, Mail, MessageSquareText, Phone, Send, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const steps = [
  {
    icon: ClipboardList,
    title: "Submit the request form",
    description: "Best when you already know the date, time, location, setting, and service details.",
  },
  {
    icon: CalendarCheck2,
    title: "Book an info session",
    description: "Best if you want help talking through the request before submitting the form.",
  },
  {
    icon: Phone,
    title: "Call or email for urgent needs",
    description: "Best for time-sensitive requests that need faster clarification or follow-up.",
  },
];

const contactMethods = [
  {
    icon: Phone,
    title: "Call",
    value: "(321) 379-8010",
    href: "tel:+13213798010",
  },
  {
    icon: Mail,
    title: "Email",
    value: "m.stubbs@miqueaslanguagesolutions.com",
    href: "mailto:m.stubbs@miqueaslanguagesolutions.com",
  },
];

export default function Contact({ palette }) {
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };
  const goldButton = { backgroundColor: palette.gold, color: palette.white };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 12% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 92% 8%, rgba(114,17,0,0.14), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)",
          }}
        />
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px]"
          >
            <div className="max-w-3xl">
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur"
                style={{ borderColor: palette.border, color: palette.burgundy }}
              >
                <Send size={15} style={{ color: palette.gold }} />
                Contact MLS
              </div>
              <h1 className="text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Start your request with the right next step.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                Whether you are ready to submit details, need help thinking through the request, or have something urgent, this page helps you choose the best way to connect.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#request-form" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                  Submit Request
                  <Send size={17} />
                </a>
                <a href="#info-session" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                  Book Info Session
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px] lg:mx-0">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-80" style={{ backgroundColor: palette.gold }} />
              <div className="relative rounded-[2.2rem] border bg-white p-4 shadow-2xl md:p-5" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#202020] p-6 text-white md:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Direct contact</p>
                  <h2 className="mt-3 text-2xl font-black leading-tight">Need a faster response?</h2>
                  <div className="mt-6 space-y-3">
                    {contactMethods.map(({ icon: Icon, title, value, href }) => (
                      <a key={title} href={href} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.1]">
                        <Icon size={20} style={{ color: palette.gold, flexShrink: 0, marginTop: 2 }} />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-white/50">{title}</span>
                          <span className="mt-1 block break-words text-sm font-semibold leading-6 text-white/90">{value}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.5rem] border bg-[#f7f3ef] p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Helpful note</p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>More complete details help MLS respond faster.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Choose your path</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>There are three ways to move forward.</h2>
          </motion.div>
          <div className="grid auto-rows-fr gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="h-full rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                  <Icon size={23} />
                </div>
                <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="request-form" className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Request form</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Ready to submit details?</h2>
            <p className="mt-4 text-base leading-8 text-[#5f6368]">
              Fill out the form with as much information as you have. The more complete the request, the easier it is to review fit, availability, and next steps.
            </p>
          </motion.div>
          <InterpreterRequestForm palette={palette} />
        </div>
      </section>

      <section id="info-session" className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-5 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Info session</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>Need help before submitting the form?</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">
                Book a short info session if you are unsure what type of service you need, what details to include, or whether the assignment is a good fit.
              </p>
              <div className="mt-6 rounded-2xl border bg-white p-5" style={{ borderColor: palette.border }}>
                <div className="flex items-start gap-3">
                  <Sparkles size={20} style={{ color: palette.gold, flexShrink: 0, marginTop: 2 }} />
                  <p className="text-sm leading-7" style={{ color: palette.body }}>
                    For urgent requests, calling or emailing directly is still the fastest option.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: 0.05 }} className="overflow-hidden rounded-[1.75rem] border bg-white shadow-sm" style={{ borderColor: palette.border }}>
              <iframe
                src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1IsSpbyLU-AVkN8IohbJ0DKcNBJo_wdJs2eqwCrx1NHTZfuFR1vqbekuvpgMVMISqFqcIVDlh4?gv=true"
                style={{ border: 0 }}
                width="100%"
                height="720"
                frameBorder="0"
                title="Google Calendar Appointment Scheduling"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
          <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
            <div className="bg-[#202020] p-7 md:p-9">
              <p className="text-sm font-semibold leading-7 text-white/70">“A clear request helps MLS understand the setting, match the right service path, and respond with next steps more efficiently.”</p>
            </div>
            <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[360px] md:p-9">
              <p className="text-sm leading-6 text-[#5f6368]">Have an urgent request?</p>
              <a href="tel:+13213798010" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Call Now <Phone size={17} /></a>
              <a href="mailto:m.stubbs@miqueaslanguagesolutions.com?subject=Urgent%20Interpreting%20Request&body=Hi%20Micah%2C%0A%0AThis%20is%20an%20urgent%20request.%20Here%20are%20my%20details%3A%0A%0AService%20needed%3A%0ADate%3A%0ATime%3A%0ALocation%20or%20platform%3A%0AOrganization%3A%0AAdditional%20details%3A%0A%0AThank%20you." className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>Email Us <Mail size={17} /></a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
