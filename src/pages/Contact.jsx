import { Mail, Phone, ArrowRight } from "lucide-react";

export default function Contact({ palette }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
      <h2
        className="mb-6 text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: palette.charcoal }}
      >
        Request a quote
      </h2>

      <p
        className="mb-10 max-w-2xl text-base md:text-lg"
        style={{ color: "#5f5f5f" }}
      >
        Share a few details about your assignment. A response can then be tailored
        to your setting, timeline, and communication needs.
      </p>

      <div className="mb-8 max-w-2xl space-y-4">
        {[
          "Submit the inquiry form with assignment details.",
          "Receive a customized response based on service type, setting, and logistics.",
          "If the request is a fit, next steps for scheduling and coordination will follow.",
        ].map((step, idx) => (
          <div key={step} className="flex items-start gap-4">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: palette.burgundy }}
            >
              {idx + 1}
            </div>
            <p
              className="pt-1 text-sm leading-6"
              style={{ color: "#5f5f5f" }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>

      <div
        className="section-shell rounded-2xl p-6"
        style={{ backgroundColor: palette.softGray }}
      >
        <p
          className="mb-4 font-semibold"
          style={{ color: palette.charcoal }}
        >
          Contact Miqueas Language Solutions
        </p>

        <div className="space-y-3 text-sm leading-6" style={{ color: "#5f5f5f" }}>
          <div className="flex items-center gap-3">
            <Mail size={18} style={{ color: palette.burgundy }} />
            <a href="mailto:mstubbsterp21@gmail.com" className="hover:opacity-70">
              mstubbsterp21@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={18} style={{ color: palette.burgundy }} />
            <a href="tel:13523968098" className="hover:opacity-70">
              (352) 396-8098
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p
          className="mb-4 text-sm leading-6"
          style={{ color: "#5f5f5f" }}
        >
          If the embedded form does not load, use the button below to open the
          quote request form in a new tab.
        </p>

        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSepJCbUYpT114I1xcH4TWC20wrLdHSc62SFnRJUPQalsAzbfw/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
        >
          Open Form in New Tab
          <ArrowRight size={16} />
        </a>
      </div>

      <iframe
        title="Miqueas Language Solutions quote request form"
        src="https://docs.google.com/forms/d/e/1FAIpQLSepJCbUYpT114I1xcH4TWC20wrLdHSc62SFnRJUPQalsAzbfw/viewform?embedded=true"
        width="100%"
        height="1300"
        frameBorder="0"
        marginHeight="0"
        marginWidth="0"
        className="section-shell mt-6 rounded-2xl"
        style={{ border: 0 }}
      >
        Loading…
      </iframe>
    </div>
  );
}