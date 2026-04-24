export default function Terms({ palette }) {
  const titleStyle = { color: palette.charcoal };
  const textStyle = { color: palette.body };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-20">
      <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-10" style={{ borderColor: palette.border }}>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl" style={titleStyle}>
          Terms & Conditions
        </h1>

        <div className="mt-6 space-y-6 text-base leading-8" style={textStyle}>
          <p>
            By accessing and using this website, you agree to the following terms. If you do not agree,
            please do not use this site.
          </p>

          <h2 className="text-xl font-semibold" style={titleStyle}>Use of Website</h2>
          <p>
            This website is intended for informational and business inquiry purposes only. Submitting
            a form does not guarantee service availability or booking.
          </p>

          <h2 className="text-xl font-semibold" style={titleStyle}>No Guarantee of Services</h2>
          <p>
            All interpreting services are subject to availability, qualifications, and scheduling. A
            separate agreement may be required for confirmed services.
          </p>

          <h2 className="text-xl font-semibold" style={titleStyle}>Intellectual Property</h2>
          <p>
            All content on this site, including text, branding, and visuals, is owned by Miqueas
            Language Solutions LLC and may not be copied or reused without permission.
          </p>

          <h2 className="text-xl font-semibold" style={titleStyle}>Limitation of Liability</h2>
          <p>
            We are not liable for any damages resulting from use of this website or reliance on
            information provided.
          </p>

          <h2 className="text-xl font-semibold" style={titleStyle}>External Links</h2>
          <p>
            This site may contain links to third-party platforms. We are not responsible for their
            content or policies.
          </p>

          <h2 className="text-xl font-semibold" style={titleStyle}>Governing Law</h2>
          <p>
            These terms are governed by the laws of the State of Florida.
          </p>
        </div>
      </div>
    </div>
  );
}
