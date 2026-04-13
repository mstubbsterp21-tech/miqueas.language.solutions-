import { useState } from "react";
import { Mail, Phone, ArrowRight } from "lucide-react";

export default function Contact({ palette }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
      <h1
        className="mb-6 text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: palette.charcoal }}
      >
        Request a quote
      </h1>

      <p
        className="mb-10 max-w-2xl text-base md:text-lg"
        style={{ color: palette.body }}
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
              style={{ color: palette.body }}
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const name = data.get('name') || '';
            const email = data.get('email') || '';
            const phone = data.get('phone') || '';
            const service = data.get('service') || '';
            const details = data.get('details') || '';

            const body = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\nDetails:\n${details}`;
            const subject = 'Quote request from website';
            window.location.href = `mailto:mstubbsterp21@gmail.com?subject=${encodeURIComponent(
              subject
            )}&body=${encodeURIComponent(body)}`;
            form.reset();
          }}
          aria-labelledby="contact-heading"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-medium" style={{ color: palette.charcoal }}>Full name</span>
              <input name="name" required className="mt-1 rounded-md border px-3 py-2" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium" style={{ color: palette.charcoal }}>Email</span>
              <input name="email" type="email" required className="mt-1 rounded-md border px-3 py-2" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium" style={{ color: palette.charcoal }}>Phone</span>
              <input name="phone" className="mt-1 rounded-md border px-3 py-2" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium" style={{ color: palette.charcoal }}>Service type</span>
              <select name="service" className="mt-1 rounded-md border px-3 py-2">
                <option>In‑Person Interpreting</option>
                <option>Video Remote Interpreting</option>
                <option>English → ASL Translation (Video)</option>
                <option>ASL → English Translation</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex flex-col">
            <span className="text-sm font-medium" style={{ color: palette.charcoal }}>Assignment details</span>
            <textarea name="details" required className="mt-1 min-h-[120px] rounded-md border px-3 py-2" />
          </label>

          <div className="mt-4 flex items-center gap-3">
            <button type="submit" className="btn btn-primary inline-flex items-center">
              Submit request
            </button>
            <a href="mailto:mstubbsterp21@gmail.com" className="btn btn-secondary inline-flex items-center">
              Email directly
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}