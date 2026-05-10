import { Link } from "react-router-dom";
import { PolicyCallout, PolicyHero, PolicyList, PolicySection } from "./PolicyShared";

const services = [
  "General community assignments",
  "Medical and healthcare assignments",
  "Educational assignments",
  "Business and workplace assignments",
  "Legal and semi-legal assignments when appropriately qualified interpreters are available",
  "Mental health assignments when appropriately qualified interpreters are available",
  "DeafBlind, tactile, close-vision, reduced-vision, or protactile assignments when appropriately qualified interpreters are available",
  "CDI/DI-supported assignments",
  "Platform, conference, and large-group assignments",
  "Performing arts and artistic assignments",
  "ASL-to-English translation",
  "English-to-ASL video translation",
  "Video Remote Interpreting when appropriate",
];

const requiredInfo = [
  "Date, start time, end time, and time zone",
  "Location or virtual platform link",
  "Assignment setting and purpose",
  "Contact person and billing contact information",
  "Known Deaf, DeafBlind, or Hard-of-Hearing consumer access needs",
  "Known communication mode, language, or interpreter preferences",
  "Possible CDI/DI or team interpreting needs",
  "Preparation materials and special instructions",
  "Technology/access information for VRI",
  "Known risks, concerns, or setting-specific requirements",
];

const clientResponsibilities = [
  "Accurate assignment details",
  "Safe and respectful working conditions",
  "Appropriate accommodations for Deaf, DeafBlind, and Hard-of-Hearing consumers",
  "Adequate lighting, seating, sight lines, and audio",
  "Setup time and access permissions",
  "Platform access for remote assignments",
  "Preparation materials when available",
  "Compliance with applicable accessibility obligations",
];

const onsiteConditions = [
  "Proper interpreter placement",
  "Clear view of speakers and signers",
  "Adequate lighting",
  "Appropriate seating",
  "Sound amplification when needed",
  "Safe and accessible location",
  "Breaks or team support when needed",
];

const vriConditions = [
  "Stable internet connection",
  "Functioning camera and microphone/audio",
  "Appropriate lighting and quiet environment",
  "Proper camera placement",
  "Platform access and required security permissions",
  "A technical contact person when needed",
];

export default function PoliciesClients({ palette }) {
  return (
    <div className="space-y-8">
      <PolicyHero
        palette={palette}
        eyebrow="Client / Requester Guide"
        title="How MLS handles service requests."
        description="This guide explains how Miqueas Language Solutions handles assignment requests, confirmation, client responsibilities, billing, cancellation, VRI, confidentiality, and feedback."
      />

      <PolicySection palette={palette} number="1" title="Purpose">
        <p>
          Miqueas Language Solutions provides professional ASL/English interpreting, Video Remote Interpreting, and ASL/English translation services. MLS is committed to services that are ethical, qualified, consumer-centered, and aligned with professional interpreting standards.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="2" title="Services Offered">
        <PolicyList items={services} />
        <PolicyCallout palette={palette} title="Services MLS does not provide">
          MLS does not provide Video Relay Service, relay-style telephone calls, VRS platform staffing, or consumer-initiated relay services. MLS may decline, delay, or refer a request if the assignment cannot be staffed safely, ethically, or effectively.
        </PolicyCallout>
      </PolicySection>

      <PolicySection palette={palette} number="3" title="Assignment Requests">
        <p>
          Clients/requesters must submit assignment requests through an MLS-approved request method, such as the MLS website form, email, approved client portal, or written communication with MLS.
        </p>
        <PolicyCallout palette={palette} title="Important">
          Submitting a request does not guarantee service and does not create a confirmed assignment.
        </PolicyCallout>
        <p>
          MLS reviews each request for setting, consumer access needs, service format, interpreter qualifications, team/CDI/DI needs, urgency, risk level, and staffing feasibility.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="4" title="Information Required Before Confirmation">
        <PolicyList items={requiredInfo} />
        <p>
          Incomplete or inaccurate information may delay confirmation, affect staffing, increase cost, or cause MLS to decline or revise the assignment.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="5" title="Assignment Confirmation">
        <p>An assignment is confirmed only when all of the following are complete:</p>
        <PolicyList
          items={[
            "The applicable Interpreting Services Agreement has been signed",
            "MLS has confirmed interpreter availability in writing",
            "Any required deposit or prepayment has been received and cleared",
          ]}
        />
        <p>
          Request forms, emails, verbal conversations, availability checks, or tentative holds do not create a confirmed assignment. MLS may release a requested time slot until all confirmation requirements are complete.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="6" title="Short-Notice and Urgent Requests">
        <p>
          MLS may accept same-day, urgent, short-notice, or emergency requests when MLS determines that the assignment can be staffed safely, ethically, and appropriately. Short-notice requests are not guaranteed.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <PolicyCallout palette={palette} title="24–48 hours">
            25% surcharge may apply.
          </PolicyCallout>
          <PolicyCallout palette={palette} title="Less than 24 hours">
            50% surcharge may apply.
          </PolicyCallout>
          <PolicyCallout palette={palette} title="Within 4 hours">
            75%–100% surcharge may apply.
          </PolicyCallout>
        </div>
        <p>
          Rush fees will be disclosed to and approved by the client before confirmation. MLS may require full prepayment for urgent, short-notice, or emergency assignments.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="7" title="Deposits and Prepayment">
        <p>
          MLS may require a deposit or prepayment based on client history, assignment duration or cost, amount of notice given, prior payment history, staffing complexity, travel requirements, specialized interpreter needs, or risk level.
        </p>
        <p>
          If a deposit or prepayment is required, the assignment is not confirmed until payment has been received and cleared. Deposits are applied toward the final balance and are non-refundable once the assignment is confirmed unless required by law or agreed in writing.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="8" title="Client Responsibilities">
        <PolicyList items={clientResponsibilities} />
        <p>
          Clients are responsible for their own compliance with applicable accessibility laws, including the ADA and other relevant legal obligations. MLS provides interpreting services but does not assume responsibility for the client’s legal accommodation duties.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="9" title="Preparation Materials">
        <p>
          Clients should provide relevant preparation materials 24–48 hours before the assignment whenever possible. This may include agendas, scripts, slides, participant names, technical vocabulary, meeting topics, training materials, performance materials, medical or legal terminology, and platform or presenter access.
        </p>
        <p>
          Failure to provide preparation materials may affect service quality but does not reduce payment obligations.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="10" title="Onsite Assignment Conditions">
        <PolicyList items={onsiteConditions} />
        <p>
          MLS may pause, terminate, or decline services if onsite conditions are unsafe, inaccessible, discriminatory, harassing, or not conducive to effective interpreting.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="11" title="Video Remote Interpreting Conditions">
        <PolicyList items={vriConditions} />
        <p>
          VRI may not be appropriate for every situation, especially when the assignment involves DeafBlind/tactile/protactile access, poor technology conditions, chaotic or mobile environments, high-risk medical communication, crisis mental health, legal or semi-legal proceedings, serious decision-making, or consumers who cannot effectively access video.
        </p>
        <p>
          Client-side technical failures, late starts, access barriers, and participant unavailability remain billable.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="12" title="Team Interpreting and CDI/DI Support">
        <p>
          MLS may determine that additional staffing is needed to provide effective communication access. Additional staffing may include team interpreters, Certified Deaf Interpreters, Deaf Interpreters, DeafBlind/tactile interpreters, or specialized interpreters.
        </p>
        <p>
          MLS may recommend or require additional support based on assignment length, pace, density, number of speakers, technical content, medical/legal/mental health/educational complexity, consumer communication needs, DeafBlind/tactile needs, fatigue risk, or communication breakdowns.
        </p>
        <p>
          If the client declines recommended staffing that MLS determines is necessary, MLS may decline, delay, limit, pause, or terminate services.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="13" title="Legal and Semi-Legal Assignments">
        <p>
          MLS may accept legal or semi-legal assignments only when appropriately qualified interpreters are available. Legal and semi-legal assignments require specialized review before confirmation.
        </p>
        <p>
          For hearing interpreters, MLS generally requires NIC or another legal-setting-approved credential, plus documented legal interpreting training or experience. SC:L is strongly preferred when available.
        </p>
        <p>
          For Deaf Interpreters in legal assignments, CDI is generally required unless the court, agency, or legal setting approves another arrangement and MLS also approves it. CDI + SC:L is strongly preferred when available.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="14" title="Recording, AI, and Use of Interpreted Content">
        <p>
          Clients may not record, reproduce, distribute, transcribe, or otherwise use interpreted content without MLS’s prior written consent. This includes audio recording, video recording, screenshots, livestream capture, transcription, automated captions, AI transcription, AI summarization, or uploading interpreted content into AI systems.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="15" title="Billing, Minimums, and Payment">
        <p>
          Billing is based on MLS’s official sign-in/sign-out records or other approved time-verification methods. Waiting time, delays, gaps, late starts, access issues, technical failures, and participant unavailability remain billable.
        </p>
        <PolicyCallout palette={palette} title="Minimum charges">
          In-person assignments have a 2-hour minimum per interpreter. VRI assignments have a 1-hour minimum per interpreter.
        </PolicyCallout>
        <p>
          Invoices are due within 30 days unless otherwise specified. Late balances may accrue interest at 1.5% per month or the maximum allowed by law, whichever is lower.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="16" title="Invoice Disputes and Cancellations">
        <p>
          Invoice disputes must be submitted in writing within 10 calendar days of invoice issuance. If no dispute is submitted within that period, the invoice and recorded time are deemed accepted.
        </p>
        <PolicyList
          items={[
            "More than 72 hours before start time: no cancellation fee; deposit may be applied to future service or refunded at MLS’s discretion",
            "24–72 hours before start time: client owes 50% of scheduled fees",
            "Less than 24 hours before start time: client owes 100% of scheduled fees",
            "Client or participant no-show: client owes 100% of scheduled fees",
          ]}
        />
      </PolicySection>

      <PolicySection palette={palette} number="17" title="Travel Costs">
        <p>
          Travel requirements are determined based on the distance between the assigned interpreter’s location and the assignment location. MLS will make reasonable efforts to assign local interpreters when available.
        </p>
        <p>
          If a non-local interpreter is needed, the client is responsible for approved travel-related costs such as mileage, airfare, lodging, parking, tolls, per diem, or other approved travel expenses. Travel costs must be reviewed, approved, and agreed to in writing before assignment confirmation.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="18" title="Safety, Confidentiality, Feedback, and Future Service">
        <p>
          MLS may suspend or terminate services immediately if the assignment environment is unsafe, harassing, discriminatory, threatening, abusive, technically inaccessible, professionally inappropriate, unsuitable for effective communication, or inconsistent with professional standards.
        </p>
        <p>
          MLS protects confidential client, consumer, interpreter, assignment, business, billing, feedback, and complaint information. MLS accepts feedback and complaints and prohibits retaliation against anyone who submits good-faith feedback, access concerns, complaints, incident reports, ethical concerns, or safety concerns.
        </p>
        <p>
          MLS reserves the right to decline future service for non-payment, abusive conduct, repeated violations, unsafe environments, harassment or discrimination, misuse of interpreted content, unauthorized recording, AI misuse, or conduct that creates legal, ethical, financial, reputational, or safety risk.
        </p>
      </PolicySection>

      <section className="rounded-[2rem] p-6 text-white md:p-8" style={{ background: `linear-gradient(135deg, ${palette.burgundy}, ${palette.charcoal})` }}>
        <h3 className="text-2xl font-bold">Need to request services?</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 md:text-base">
          Submit your request with as much detail as possible so MLS can review the assignment and determine appropriate staffing.
        </p>
        <Link to="/contact" className="mt-5 inline-flex rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
          Request Services
        </Link>
      </section>
    </div>
  );
}
