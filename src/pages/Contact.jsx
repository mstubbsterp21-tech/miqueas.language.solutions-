import InterpreterRequestForm from '../components/InterpreterRequestForm';
import { motion } from 'framer-motion';

const emailIcon = (
  <svg viewBox="0 0 64 64" aria-hidden="true" className="h-8 w-8 md:h-10 md:w-10">
    <circle cx="32" cy="32" r="30" fill="#8B2E00" />
    <circle cx="32" cy="32" r="24" fill="none" stroke="#FFFFFF" strokeWidth="3" />
    <path d="M18 22h28v20H18z" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
    <path d="M18 22l14 12 14-12" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

const phoneIcon = (
  <svg viewBox="0 0 64 64" aria-hidden="true" className="h-8 w-8 md:h-10 md:w-10">
    <circle cx="32" cy="32" r="30" fill="#8B2E00" />
    <circle cx="32" cy="32" r="24" fill="none" stroke="#FFFFFF" strokeWidth="3" />
    <path d="M25 18c1 0 2 .6 2.5 1.5l3 5.5c.6 1 .5 2.3-.3 3.1l-2.4 2.4c2 3.8 5.1 6.9 8.9 8.9l2.4-2.4c.8-.8 2.1-.9 3.1-.3l5.5 3c.9.5 1.5 1.5 1.5 2.5V47c0 1.7-1.3 3-3 3-15.5 0-28-12.5-28-28 0-1.7 1.3-3 3-3h4Z" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const steps = [
  {
    title: '1. Submit the request form',
    description: 'Best for clients who already know the date, time, location, and service details needed for an interpreting request.',
  },
  {
    title: '2. Book an info session',
    description: 'Best if you want help talking through the request before submitting the form or need guidance on what information to provide.',
  },
  {
    title: '3. Call or email for urgent needs',
    description: 'Best for time-sensitive requests that need a faster response or immediate clarification.',
  },
];

export default function Contact({ palette }) {
  return (
    <div className="space-y-10 pt-8 md:pt-12">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl rounded-3xl border px-5 py-8 md:px-8 md:py-10 shadow-sm"
        style={{
          borderColor: palette.border,
          backgroundColor: palette.white,
        }}
      >
        <div className="max-w-3xl">
          <p
            className="inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{
              color: palette.charcoal,
              borderColor: palette.border,
              backgroundColor: `${palette.gold}12`,
            }}
          >
            Contact Miqueas Language Solutions
          </p>

          <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl" style={{ color: palette.charcoal }}>
            Request interpreting services the way that works best for you.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg" style={{ color: palette.body }}>
            Use the request form if you are ready to submit details. If you would rather talk through it first, book a quick info session and I can help you complete the form. For urgent requests, call or email directly.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border p-5"
              style={{
                borderColor: palette.border,
                backgroundColor: `${palette.gold}08`,
              }}
            >
              <h2 className="text-base font-semibold" style={{ color: palette.charcoal }}>
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: palette.body }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-4 px-1 text-center md:text-left">
          <h2 className="text-2xl font-semibold" style={{ color: palette.charcoal }}>
            Ready to submit your request?
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: palette.body }}>
            Fill out the form below with as much detail as you have. The more complete the request, the faster I can review it and respond.
          </p>
        </div>

        <InterpreterRequestForm palette={palette} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl rounded-3xl border p-4 md:p-6 shadow-sm"
        style={{
          borderColor: palette.border,
          backgroundColor: palette.white,
        }}
      >
        <div className="mb-6 max-w-3xl text-center md:text-left">
          <h2 className="text-2xl font-semibold" style={{ color: palette.charcoal }}>
            Need help before submitting the form?
          </h2>

          <p className="mt-3 text-sm leading-6" style={{ color: palette.body }}>
            Book a short info session if you want to walk through your request with me first. This is helpful if you are unsure what type of service you need, what details to include, or whether the assignment is a good fit.
          </p>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border" style={{ borderColor: palette.border }}>
          <iframe
            src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1IsSpbyLU-AVkN8IohbJ0DKcNBJo_wdJs2eqwCrx1NHTZfuFR1vqbekuvpgMVMISqFqcIVDlh4?gv=true"
            style={{ border: 0 }}
            width="100%"
            height="750"
            frameBorder="0"
            title="Google Calendar Appointment Scheduling"
          />
        </div>

        <div className="mt-6 border-t pt-6 text-center" style={{ borderColor: palette.border }}>
          <p className="mx-auto max-w-3xl text-sm leading-6" style={{ color: palette.body }}>
            For urgent requests, call or email directly and I’ll get back to you as soon as possible.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="tel:+13523968098"
              className="inline-flex min-w-[220px] items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90"
              style={{
                backgroundColor: palette.gold,
                color: palette.white,
              }}
            >
              <span className="shrink-0">{phoneIcon}</span>
              <span>Call Now</span>
            </a>

            <a
              href="mailto:m.stubbs@miqueaslanguagesolutions.com?subject=Urgent%20Interpreting%20Request&body=Hi%20Micah%2C%0A%0AThis%20is%20an%20urgent%20request.%20Here%20are%20my%20details%3A%0A%0AService%20needed%3A%0ADate%3A%0ATime%3A%0ALocation%20or%20platform%3A%0AOrganization%3A%0AAdditional%20details%3A%0A%0AThank%20you."
              className="inline-flex min-w-[220px] items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90"
              style={{
                backgroundColor: palette.gold,
                color: palette.white,
              }}
            >
              <span className="shrink-0">{emailIcon}</span>
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
