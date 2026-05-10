import { Link } from "react-router-dom";
import { PolicyCallout, PolicyHero, PolicyList, PolicySection } from "./PolicyShared";

const preferences = [
  "Specific interpreter request",
  "Request not to use a specific interpreter",
  "CDI/DI support",
  "Onsite interpreting instead of VRI",
  "Communication mode or language preference",
  "ASL, tactile ASL, close-vision signing, protactile, transliteration, oral transliteration, or cued speech",
  "Gender or comfort-based preference when relevant",
  "Team interpreting",
  "Interpreter continuity",
];

const accessConcerns = [
  "Interpreter is not visible",
  "Interpreter cannot hear or see the source message",
  "VRI technology is not working",
  "Consumer cannot understand the interpreter",
  "Interpreter appears unqualified for the setting",
  "CDI/DI support appears necessary",
  "Team interpreting appears necessary",
  "Communication mode is not being honored",
  "Environment prevents effective communication",
];

const feedbackOptions = [
  "Written English",
  "ASL video upload",
  "ASL video link",
  "Other accessible formats when practical",
];

export default function PoliciesConsumers({ palette }) {
  return (
    <div className="space-y-8">
      <PolicyHero
        palette={palette}
        eyebrow="Consumer Access Guide"
        title="Your access needs matter here."
        description="This guide explains how Deaf, DeafBlind, and Hard-of-Hearing consumers can share communication preferences, request support, report access concerns, and submit feedback to MLS."
      />

      <PolicyCallout palette={palette} title="Public-facing policy summary">
        This guide is a public-facing summary of MLS policies. Specific assignments may be governed by signed agreements, written confirmations, assignment summaries, and applicable law.
      </PolicyCallout>

      <PolicySection palette={palette} number="1" title="Consumer-Centered Service Standard">
        <p>
          MLS recognizes that the paying client is not always the person most affected by interpreting quality. MLS considers the communication access, dignity, preferences, and needs of Deaf, DeafBlind, Hard-of-Hearing, and hearing consumers in assignment planning and quality review.
        </p>
        <PolicyCallout palette={palette} title="Access comes first">
          MLS will not ignore consumer access concerns simply because the paying client did not raise them.
        </PolicyCallout>
      </PolicySection>

      <PolicySection palette={palette} number="2" title="Consumer Preferences and Informed Choice">
        <p>MLS will make reasonable efforts to honor consumer preferences related to interpreting services.</p>
        <PolicyList items={preferences} />
        <p>
          MLS will honor preferences whenever possible while considering interpreter qualifications, availability, risk, conflicts of interest, confidentiality, and effective access.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="3" title="Communication Mode and Language Preferences">
        <p>
          MLS will attempt to identify and honor the consumer’s preferred communication mode when possible. MLS will not assume that all Deaf, DeafBlind, or Hard-of-Hearing consumers use the same communication mode.
        </p>
        <PolicyList
          items={[
            "ASL",
            "English-based signing",
            "Tactile ASL",
            "Protactile",
            "Close-vision signing",
            "Oral transliteration",
            "Cued Speech",
            "CASE or MCE",
            "Foreign sign language",
            "Trilingual communication",
            "Written English",
            "Other visual, signed, tactile, or spoken modalities",
          ]}
        />
      </PolicySection>

      <PolicySection palette={palette} number="4" title="Specific Interpreter Requests">
        <p>
          Consumers may request a specific interpreter. MLS will honor specific interpreter requests when possible, subject to interpreter availability, interpreter qualifications, conflicts of interest, assignment demands, continuity needs, client requirements, MLS policy, safety, and ethical considerations.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="5" title="Requests Not to Use a Specific Interpreter">
        <p>
          Consumers may request that MLS not assign a specific interpreter. MLS will consider such requests confidentially and will make reasonable efforts to honor them when appropriate.
        </p>
        <p>
          MLS may ask for additional information when necessary for safety, quality assurance, conflict review, or complaint resolution.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="6" title="Gender or Comfort-Based Preferences">
        <p>
          MLS may consider gender or comfort-based interpreter preferences when relevant to medical care, mental health, trauma, personal dignity, religious or cultural needs, safety, or consumer comfort.
        </p>
        <p>
          MLS will balance these preferences with interpreter availability, qualifications, and legal or ethical requirements.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="7" title="CDI/DI Support Requests">
        <p>
          Consumers may request Certified Deaf Interpreter or Deaf Interpreter support. MLS will review the request and determine whether CDI/DI support is available and appropriate.
        </p>
        <p>
          MLS may also recommend or require CDI/DI support even if the client did not request it, especially when communication access would be improved by the presence of a Deaf interpreter.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="8" title="Onsite vs. VRI Preferences">
        <p>
          MLS will consider consumer preferences for onsite or VRI services. Onsite interpreting is preferred whenever practical, available, and appropriate.
        </p>
        <p>
          VRI may be used only when the interpreting situation supports effective remote communication. If a consumer requests onsite service and onsite service is reasonably available and appropriate, MLS will make reasonable efforts to provide onsite interpreting.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="9" title="DeafBlind, Tactile, and Protactile Access Preferences">
        <p>
          For DeafBlind, tactile, close-vision, reduced-vision, or protactile assignments, MLS will review the consumer’s specific access preferences before staffing.
        </p>
        <PolicyList
          items={[
            "Tactile ASL",
            "Protactile",
            "Close-vision signing",
            "Tracking",
            "Haptics",
            "Print-on-palm",
            "Environmental description",
            "Mobility-related access",
            "Seating and lighting needs",
            "SSP/CN support",
            "Team interpreting",
          ]}
        />
        <p>
          VRI will generally not be considered appropriate unless the consumer’s specific access needs can be met remotely.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="10" title="How MLS Collects Consumer Preferences">
        <p>MLS may collect consumer preferences through client/requester intake and a separate consumer preference/feedback form.</p>
        <p>
          MLS will not rely only on the paying client’s understanding of the Deaf consumer’s needs. Consumer preference information will be handled confidentially and shared only as needed for assignment coordination, interpreter matching, access planning, and quality assurance.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="11" title="Preference and Feedback Form">
        <p>MLS may provide a separate form for Deaf, DeafBlind, and Hard-of-Hearing consumers to submit preferences and feedback directly when possible.</p>
        <PolicyList
          items={[
            "Preferred interpreter",
            "Interpreter they do not want assigned",
            "Communication mode",
            "CDI/DI request",
            "Onsite/VRI preference",
            "DeafBlind access needs",
            "Interpreter continuity preference",
            "Access concerns",
            "Positive feedback",
            "Complaints or serious concerns",
          ]}
        />
      </PolicySection>

      <PolicySection palette={palette} number="12" title="Written English and ASL Video Submission Options">
        <p>MLS will allow consumer preferences and feedback to be submitted through accessible options whenever practical.</p>
        <PolicyList items={feedbackOptions} />
        <p>
          MLS will not require Deaf consumers to provide feedback only in written English. ASL video submissions will be treated as confidential assignment-related information and shared only as needed for access planning, quality assurance, complaint review, interpreter matching, or corrective action.
        </p>
      </PolicySection>

      <PolicySection palette={palette} number="13" title="Immediate Access Concerns During an Assignment">
        <p>Consumers may report immediate access concerns during an assignment when communication is not working.</p>
        <PolicyList items={accessConcerns} />
        <p>
          MLS may respond by contacting the requester, contacting the assigned interpreter, providing technical support, recommending CDI/DI support, adding a team interpreter, replacing the interpreter, switching service format, or documenting the concern for quality review.
        </p>
        <PolicyCallout palette={palette} title="Time-sensitive access concern">
          MLS will treat immediate access concerns as time-sensitive when they affect current communication access.
        </PolicyCallout>
      </PolicySection>

      <PolicySection palette={palette} number="14" title="Confidentiality and No Retaliation">
        <p>
          MLS protects confidential client, consumer, interpreter, assignment, business, billing, feedback, and complaint information. Confidential information will be accessed, used, and shared only as needed for assignment coordination, service delivery, billing, compliance, quality assurance, complaint review, or legal/ethical obligations.
        </p>
        <p>
          MLS prohibits retaliation against anyone who submits good-faith feedback, access concerns, complaints, incident reports, ethical concerns, or safety concerns.
        </p>
        <p>
          MLS standards do not override stricter court, school district, facility, state, federal, or contract requirements.
        </p>
      </PolicySection>

      <section className="rounded-[2rem] p-6 text-white md:p-8" style={{ background: `linear-gradient(135deg, ${palette.burgundy}, ${palette.charcoal})` }}>
        <h3 className="text-2xl font-bold">Need to share an access concern?</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 md:text-base">
          Contact MLS directly if communication access is not working, if you want to share a preference, or if you need to submit feedback about an assignment.
        </p>
        <Link to="/contact" className="mt-5 inline-flex rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
          Contact MLS
        </Link>
      </section>
    </div>
  );
}
