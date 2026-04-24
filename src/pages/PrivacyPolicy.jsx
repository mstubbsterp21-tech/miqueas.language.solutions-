export default function PrivacyPolicy({ palette }) {
  const sectionTitle = {
    color: palette.charcoal,
  };

  const bodyText = {
    color: palette.body,
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-20">
      <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-10" style={{ borderColor: palette.border }}>
        <div className="mb-8">
          <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: palette.gold }}>
            Legal
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl" style={sectionTitle}>
            Privacy Policy
          </h1>
          <p className="mt-4 text-base leading-7 md:text-lg" style={bodyText}>
            Effective date: April 20, 2026
          </p>
        </div>

        <div className="space-y-8 text-base leading-8" style={bodyText}>
          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Overview</h2>
            <p className="mt-3">
              Miqueas Language Solutions LLC ("MLS," "we," "our," or "us") respects your privacy.
              This Privacy Policy explains how we collect, use, store, and share information when you
              visit our website, submit an inquiry, request services, or express interest in joining our
              interpreter roster.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Information We Collect</h2>
            <div className="mt-3 space-y-3">
              <p>We may collect the following types of information:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Contact information such as your name, email address, phone number, and organization name.</li>
                <li>Service-related details you provide through inquiry or booking forms.</li>
                <li>Interpreter roster information submitted by interpreters or contractors.</li>
                <li>Technical information such as browser type, device type, IP address, and general site usage data.</li>
                <li>Any other information you voluntarily provide through our website, email, or related communication tools.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>How We Use Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Respond to service inquiries and general questions.</li>
              <li>Review interpreting requests and determine availability or fit.</li>
              <li>Communicate with prospective clients, interpreters, and contractors.</li>
              <li>Operate, improve, and secure our website and business processes.</li>
              <li>Maintain records related to inquiries, bookings, and roster submissions.</li>
              <li>Comply with applicable legal, regulatory, and business obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>How We May Share Information</h2>
            <p className="mt-3">
              We do not sell your personal information. We may share information only as reasonably
              necessary to operate our business, such as with service providers, website tools, form
              processors, scheduling tools, or qualified interpreters and contractors involved in fulfilling
              a request. We may also disclose information when required by law or to protect our legal rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Data Retention</h2>
            <p className="mt-3">
              We retain information for as long as reasonably necessary for business, operational,
              legal, recordkeeping, and security purposes. The length of retention may vary depending
              on the nature of the information and the purpose for which it was collected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Cookies and Analytics</h2>
            <p className="mt-3">
              Our website may use cookies, analytics, or similar tools to understand site traffic,
              improve performance, and enhance user experience. These tools may collect general
              technical and usage information. You can manage cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Third-Party Services</h2>
            <p className="mt-3">
              Our website may rely on third-party platforms or tools for hosting, forms, analytics,
              email communication, scheduling, or other operational needs. Those services may collect
              or process information according to their own privacy practices. We encourage you to
              review applicable third-party policies when relevant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Data Security</h2>
            <p className="mt-3">
              We take reasonable steps to protect information from unauthorized access, misuse,
              loss, or disclosure. However, no website, transmission method, or storage system can
              be guaranteed to be completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Your Choices</h2>
            <p className="mt-3">
              You may contact us to request updates to your information, ask questions about our
              privacy practices, or request that we review a specific privacy concern. We will review
              requests in light of applicable legal, contractual, and operational obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Children's Privacy</h2>
            <p className="mt-3">
              This website is not directed to children, and we do not knowingly collect personal
              information directly from children through this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Policy Updates</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. When we do, we will post the
              revised version on this page and update the effective date above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold" style={sectionTitle}>Contact</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy, please contact Miqueas Language
              Solutions LLC through the contact information provided on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
