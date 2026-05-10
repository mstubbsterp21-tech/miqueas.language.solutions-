import { Link } from "react-router-dom";
import { PolicyCallout, PolicyHero, PolicyList, PolicySection, PolicyTable } from "./PolicyShared";

const onboarding = [
  "Contractor application",
  "W-9",
  "Independent Contractor Agreement",
  "Credential documentation",
  "EIPA documentation when applicable",
  "References and work samples when requested",
  "Ethics and professional judgment screening",
  "Performance screening",
  "Rate schedule",
  "Confidentiality acknowledgment",
  "Insurance or background check documentation when required",
  "VRI technology check when applicable",
  "Review of MLS policies and procedures",
];

const selfAssessment = [
  "Setting and subject matter",
  "Communication mode and consumer needs",
  "Emotional intensity and risk level",
  "Physical, mental, and emotional readiness",
  "Conflicts of interest",
  "Preparation requirements",
  "Team/CDI/DI needs",
  "Legal, medical, educational, or regulated requirements",
];

const documentation = [
  "Signing a client verification form",
  "Submitting portal time",
  "Sending MLS arrival/departure confirmation",
  "Documenting platform login/logout",
  "Obtaining client-approved time verification",
  "Submitting notes or incident reports when required",
];

const reportableConcerns = [
  "Unsafe or inaccessible working conditions",
  "Confidentiality concerns",
  "Conflicts of interest",
  "Technical failures",
  "Consumer access concerns",
  "Client refusal of needed support",
  "Scope changes",
  "Suspected legal/semi-legal issues",
  "Medical or mental health escalation",
  "Unauthorized recording or AI/transcription misuse",
  "Interpreter fitness concerns",
];

export default function PoliciesInterpreters({ palette }) {
  return (
    <div className="space-y-8">
      <PolicyHero
        palette={palette}
        eyebrow="Interpreter / Contractor Guide"
        title="Clear standards for working with MLS."
        description="This guide summarizes MLS expectations for interpreters and contractors, including qualifications, screening, assignment acceptance, confidentiality, conduct, documentation, and roster status."
      />

      <PolicyCallout palette={palette} title="Public-facing policy summary">
        This guide is a public-facing summary of MLS policies. Specific assignments may be governed by signed agreements, written confirmations, assignment summaries, and applicable law.
      </PolicyCallout>

      <PolicySection palette={palette} number="1" title="Professional Standards">
        <p>
          MLS expects interpreters and contractors to follow the NAD-RID Code of Professional Conduct, applicable professional standards, client-specific requirements, and MLS policies for every assignment accepted through MLS.
        </p>
        <p>
          MLS will not assign based on availability alone. Assignment matching is based on credentials, documented experience, setting, language and communication needs, modality, risk level, consumer preferences, conflicts of interest, team/CDI/DI needs, working conditions, and setting-specific requirements.
        </p>
        <p>
          MLS standards do not override stricter court, school district, facility, state, federal, or contract requirements.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="2" title="Recognized Qualification Pathways">
        <PolicyList
          items={[
            "RID certification",
            "BEI certification",
            "EIPA 4.0+ with passed EIPA Written Test as an MLS-recognized qualification pathway",
            "MLS-approved uncertified interpreter status after successful screening",
          ]}
        />
        <PolicyCallout palette={palette} title="Credential accuracy">
          MLS will not misrepresent EIPA as RID or BEI certification. EIPA is treated as an educational interpreting assessment and written knowledge assessment.
        </PolicyCallout>
      </PolicySection>

      <PolicySection palette={palette} number="3" title="Interpreter Onboarding">
        <p>Interpreters must complete MLS onboarding before accepting assignments unless MLS grants a limited exception in writing.</p>
        <PolicyList items={onboarding} />
        <p>MLS may restrict assignment offers until onboarding is complete.</p>
      </PolicySection>

      <PolicySection palette={palette} number="4" title="Screening and Approval Categories">
        <p>
          MLS may approve interpreters by assignment category rather than granting general approval for all work. Approval may be granted, limited, denied, suspended, or revised by category.
        </p>
        <PolicyTable
          palette={palette}
          columns={["Category", "MLS Standard"]}
          rows={[
            ["General Community", "RID, BEI, EIPA 3.5+, or MLS-approved screened interpreter."],
            ["Education", "RID, BEI, EIPA 3.5+, or MLS-approved screened interpreter; stricter state, district, or contract requirements still apply."],
            ["Basic Medical", "RID, BEI, or EIPA 4.0+ with passed EIPA Written preferred; MLS-approved screened interpreters may be considered when ready."],
            ["High-Risk Medical", "RID, BEI, or EIPA 4.0+ with passed EIPA Written plus documented medical experience."],
            ["Crisis Mental Health", "Recognized certification plus documented mental health/crisis interpreting experience required."],
            ["Legal / Semi-Legal", "Legal and semi-legal assignments are not automatically accepted and require specialized review. NIC generally required for hearing interpreters unless another court/agency-approved credential is accepted and MLS approves; documented legal training/experience required; RID Specialist Certificate: Legal (SC:L) strongly preferred."],
            ["DeafBlind / Tactile / Protactile", "Documented DeafBlind/tactile/protactile experience is the primary qualification factor."],
            ["CDI / DI Assignments", "CDI preferred. Non-certified DIs may be approved after MLS screening, documented experience, references, and work sample review."],
          ]}
        />
      </PolicySection>

      <PolicySection palette={palette} number="5" title="Modality-Specific Qualification">
        <p>
          MLS will not assume that ASL interpreting ability qualifies an interpreter for every signed, visual, tactile, spoken, or transliteration modality.
        </p>
        <PolicyList
          items={[
            "Oral transliteration",
            "Cued Speech",
            "Tactile ASL or protactile",
            "Close-vision signing",
            "CASE, MCE, or signed English systems",
            "Trilingual interpreting",
            "Foreign sign language",
            "ASL/English translation",
            "DeafBlind interpreting",
            "Platform, conference, or performing arts interpreting",
          ]}
        />
      </PolicySection>

      <PolicySection palette={palette} number="6" title="Assignment-Specific Acceptance">
        <p>
          Each assignment accepted by an interpreter is governed by the MLS Independent Contractor Agreement, assignment-specific confirmation, client requirements, applicable laws, professional standards, rate/minimum/travel terms, documentation requirements, and special instructions.
        </p>
        <p>
          Once an interpreter accepts an assignment, acceptance becomes a binding professional commitment. By accepting, the interpreter represents that they are qualified, available, properly credentialed when applicable, able to perform competently, able to perform ethically, and able to comply with assignment-specific requirements.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="7" title="Self-Assessment Before Acceptance">
        <p>Before accepting an assignment, interpreters must determine whether they are qualified, available, properly credentialed if applicable, and able to perform the assignment competently, ethically, and safely.</p>
        <PolicyList items={selfAssessment} />
      </PolicySection>

      <PolicySection palette={palette} number="8" title="Withdrawal From Accepted Assignments">
        <p>
          After acceptance, an interpreter may withdraw only for fair and justifiable grounds, such as illness, emergency, safety concerns, ethical conflict, lack of competence for the actual assignment presented, unexpected conflict of interest, or other substantial cause.
        </p>
        <p>The interpreter must notify MLS immediately upon learning of any issue that may affect performance.</p>
      </PolicySection>

      <PolicySection palette={palette} number="9" title="Conflicts of Interest and Multiple Roles">
        <p>
          Interpreters must disclose actual, potential, or perceived conflicts before accepting an assignment and anytime one becomes known before, during, or after the assignment.
        </p>
        <p>
          Interpreters may not simultaneously serve as interpreter and advocate, teacher, friend/support person, employee representative, consultant, care provider, investigator, legal/medical/mental health advisor, or decision-maker unless MLS specifically reviews and approves the arrangement.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="10" title="Team Interpreting and CDI/DI Support">
        <p>
          MLS may recommend or require team interpreting, CDI/DI support, DeafBlind/tactile support, or specialized staffing when needed for effective communication access.
        </p>
        <p>
          Interpreters assigned as part of a team are expected to coordinate professionally, support message accuracy, maintain boundaries, avoid undermining colleagues, follow team switching/support expectations, and preserve confidentiality.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="11" title="Reporting, Readiness, and Check-In/Check-Out">
        <p>Interpreters must report on time, prepared, and ready to begin at the required start time.</p>
        <PolicyList items={documentation} />
        <p>Failure to complete required check-in/check-out documentation may delay payment and may affect MLS’s ability to bill the client.</p>
      </PolicySection>

      <PolicySection palette={palette} number="12" title="Assignment Notes and Incident Reporting">
        <p>
          Assignment notes must be factual, concise, professional, and limited to information needed for coordination, billing, quality assurance, access planning, incident review, or future assignment improvement.
        </p>
        <PolicyCallout palette={palette} title="Avoid in notes">
          Avoid unnecessary consumer details, personal opinions, diagnostic language, gossip, emotional commentary, blame-based language, and confidential content unrelated to the access issue.
        </PolicyCallout>
        <p>Interpreters should promptly report concerns that may affect safety, access, confidentiality, billing, or future assignment planning.</p>
        <PolicyList items={reportableConcerns} />
      </PolicySection>

      <PolicySection palette={palette} number="13" title="Confidentiality, Recording, and AI Restrictions">
        <p>
          Interpreters must protect client, consumer, assignment, business, screening, complaint, and quality-assurance information. Assignment details may be used only for preparation and service delivery.
        </p>
        <p>
          Contractors may not record assignments, retain screenshots, save chat logs, create transcripts, or permit any person or system to capture assignment content unless expressly authorized in writing by MLS and the client and permitted by law.
        </p>
        <p>
          Contractors may not upload, paste, route, summarize, process, or expose confidential assignment content through AI, automated transcription, or third-party systems unless explicitly authorized in writing by MLS for that assignment.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="14" title="Documentation, Payment, and Disputes">
        <p>
          Contractor payment is conditioned on proper performance, compliance with MLS agreements, submission of required documentation, and verification of services.
        </p>
        <p>
          Contractors must submit required documentation within the timeframe designated by MLS. If no timeframe is designated, documentation must be submitted within 48 hours after assignment completion.
        </p>
        <p>
          Contractors must notify MLS of payment disputes within 7 days of payment. Failure to do so constitutes acceptance of payment as accurate and complete.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="15" title="Roster Restriction, Suspension, or Removal">
        <p>
          MLS may restrict, suspend, or remove a contractor from the roster for breach of agreement, breach of confidentiality, falsification of credentials/invoices/records, no-show or abandonment, unsafe/discriminatory/harassing/dishonest/unprofessional conduct, unauthorized direct dealing with MLS clients, impairment, repeated lateness, failure to maintain required qualifications, or conduct likely to expose MLS to liability or reputational harm.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="16" title="Feedback, Complaints, and No Retaliation">
        <p>
          MLS accepts feedback and complaints from clients, consumers, interpreters, and other involved parties. MLS may review concerns involving service quality, access barriers, interpreter conduct, credentials, billing, safety, or ethics.
        </p>
        <p>
          MLS prohibits retaliation against anyone who submits good-faith feedback, access concerns, complaints, incident reports, ethical concerns, or safety concerns.
        </p>
      </PolicySection>

      <section className="rounded-[2rem] p-6 text-white md:p-8" style={{ background: `linear-gradient(135deg, ${palette.burgundy}, ${palette.charcoal})` }}>
        <h3 className="text-2xl font-bold">Interested in joining the roster?</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 md:text-base">
          MLS is building a values-driven roster with clear standards, consumer-centered policies, and setting-specific assignment approval.
        </p>
        <Link to="/resources/interpreters" className="mt-5 inline-flex rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
          Join Our Roster
        </Link>
      </section>
    </div>
  );
}
