import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ServiceDetail({ palette }) {
  const { serviceId } = useParams();

  const services = {
    "in-person-interpreting": {
      title: "In‑Person Interpreting",
      subtitle: "Professional ASL interpreting services for on-site assignments",
      description:
        "Professional ASL interpreting services for on-site assignments across a variety of settings. Whether in medical, educational, cruise, or community environments, in-person interpreting provides direct, real-time communication access.",
      certifications: "EIPA; RID-aligned practices; ongoing professional development",
      examples: "Hospital intake, clinic appointments, parent‑teacher meetings, community events",
      rates: "Typical range: $60–$120/hr (varies with setting, travel, and prep)",
      details: [
        {
          heading: "What to expect",
          content:
            "When you book an in-person interpreter, you can expect someone who arrives prepared, positioned for visibility, and ready to facilitate clear communication. The interpreter will work to adapt to the specific setting, whether that's a one-on-one appointment or a group setting.",
        },
        {
          heading: "Preparation",
          content:
            "For best results, sharing materials in advance (appointment notes, agendas, specialized terminology) helps the interpreter prepare and ensures smoother communication. This is especially important in medical, legal, or technical settings.",
        },
        {
          heading: "Travel considerations",
          content:
            "In-person assignments within Ocala are included in standard rates. Travel to surrounding areas is considered on a case-by-case basis. For assignments requiring travel, rates may adjust to account for time and distance.",
        },
        {
          heading: "Setting up your appointment",
          content:
            "Contact Miqueas Language Solutions with your assignment details, including date, time, location, and nature of the meeting. You'll receive a customized response with rates, availability confirmation, and any logistics coordination needed.",
        },
      ],
    },
    "video-remote-interpreting": {
      title: "Video Remote Interpreting",
      subtitle: "Reliable interpreting for virtual meetings and appointments",
      description:
        "Reliable interpreting for virtual meetings, appointments, and remote communication needs. Video remote interpreting (VRI) provides real-time access via video platform, making it ideal for telehealth, remote meetings, and other virtual interactions.",
      certifications: "Remote interpreting best practices; HIPAA-aware for medical settings",
      examples: "Telehealth visits, remote meetings, brief virtual consultations",
      rates: "Typical range: $40–$90/hr (lower minimums for short sessions)",
      details: [
        {
          heading: "How it works",
          content:
            "Video remote interpreting connects you with an interpreter via video platform (Zoom, Teams, Google Meet, or other services). The interpreter joins the call and provides real-time communication support, positioned so both parties can see clearly.",
        },
        {
          heading: "Platform accessibility",
          content:
            "VRI works best with platforms that support video clearly and allow multiple participants. The interpreter will guide setup if needed. Most common platforms (Zoom, Teams, Google Meet) work well for this service.",
        },
        {
          heading: "Medical and sensitive settings",
          content:
            "For healthcare, legal, or confidential interactions, HIPAA and privacy best practices are followed. Ensure your video platform complies with privacy requirements for your specific needs.",
        },
        {
          heading: "Testing and preparation",
          content:
            "For important appointments, test your technology beforehand. A quick sound and video check ensures smooth communication when it's time to connect.",
        },
      ],
    },
    "english-asl-translation": {
      title: "English → ASL Translation (Video)",
      subtitle: "Recorded video translations from English into ASL",
      description:
        "Recorded video translations from English into ASL for accessible communication. This service creates clear, professional ASL translations of written or spoken English content, perfect for patient education, organizational communications, or training materials.",
      certifications: "Experience producing clear ASL narrative translations; video captioning knowledge",
      examples: "Patient education videos, informational content, short training clips",
      rates: "Project-based; samples often start around $150+ depending on length and editing",
      details: [
        {
          heading: "What's included",
          content:
            "Each translation includes the recorded ASL performance, clear framing, appropriate lighting, and professional video. Depending on project scope, this may include editing, color grading, and delivery in multiple formats.",
        },
        {
          heading: "Best practices for materials",
          content:
            "Submit scripts or materials in advance for review. Keep content clear and concise—longer videos may require multiple recordings or breaks for natural pacing. Technical terminology is handled with care to ensure clarity.",
        },
        {
          heading: "Timeline and revisions",
          content:
            "Project timelines depend on length and complexity. Simple videos (2–5 minutes) typically have faster turnaround. Revisions are accommodated to ensure the final product meets your needs.",
        },
        {
          heading: "Use cases",
          content:
            "Perfect for organizations needing accessible videos, healthcare providers creating patient education content, educational institutions sharing information, or any organization serving Deaf audiences.",
        },
      ],
    },
    "asl-english-translation": {
      title: "ASL → English Translation",
      subtitle: "Captioned video or written transcription of ASL content",
      description:
        "Captioned video or written/spoken transcription of ASL content into English. This service ensures ASL content is accessible to hearing audiences through accurate English translation, captioning, and professional transcription.",
      certifications: "Transcription and caption review experience; accuracy-focused workflow",
      examples: "Event recordings, ASL interviews, classroom content transcription",
      rates: "Typical range: $45–$95/hr (depends on turnaround and complexity)",
      details: [
        {
          heading: "Translation options",
          content:
            "Choose from captioned video (burned-in or separate caption file), written transcription, or spoken narration. Each format serves different accessibility needs and use cases.",
        },
        {
          heading: "Accuracy and detail",
          content:
            "ASL-to-English translation captures not just words, but meaning, tone, and cultural context. Detailed descriptions of non-manual markers, expressions, and visual elements ensure the translation is complete and accurate.",
        },
        {
          heading: "Turnaround times",
          content:
            "Standard turnaround is 5–7 business days. Rush delivery and expedited reviews are available. Longer or more complex content may require extended timelines.",
        },
        {
          heading: "Deliverables",
          content:
            "Receive your translated content in the format(s) specified. All captions, transcripts, or narration files are provided in editable and final formats for your convenience.",
        },
      ],
    },
  };

  const service = services[serviceId];

  if (!service) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="text-center">
          <h1 style={{ color: palette.charcoal }} className="text-3xl font-bold">
            Service not found
          </h1>
          <Link to="/services" className="btn btn-primary mt-6 inline-flex items-center">
            <ArrowLeft size={16} />
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
      <Link to="/services" className="btn btn-secondary mb-8 inline-flex items-center gap-2">
        <ArrowLeft size={16} />
        Back to Services
      </Link>

      <h1 className="text-4xl font-bold md:text-5xl" style={{ color: palette.charcoal }}>
        {service.title}
      </h1>
      <p className="mt-3 text-lg leading-8" style={{ color: palette.body }}>
        {service.subtitle}
      </p>

      <div className="mt-10 space-y-6 rounded-2xl border p-6 md:p-8" style={{ borderColor: palette.border }}>
        <p className="text-base leading-7" style={{ color: palette.body }}>
          {service.description}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold" style={{ color: palette.charcoal }}>
              Certifications
            </h3>
            <p className="mt-2 text-sm" style={{ color: palette.body }}>
              {service.certifications}
            </p>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: palette.charcoal }}>
              Example Assignments
            </h3>
            <p className="mt-2 text-sm" style={{ color: palette.body }}>
              {service.examples}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold" style={{ color: palette.charcoal }}>
            Typical Rates
          </h3>
          <p className="mt-2 text-sm" style={{ color: palette.body }}>
            {service.rates}
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-10">
        {service.details.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-2xl font-bold" style={{ color: palette.charcoal }}>
              {section.heading}
            </h2>
            <p className="mt-3 text-base leading-7" style={{ color: palette.body }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl p-8 shadow-sm" style={{ backgroundColor: palette.softGray }}>
        <h2 className="text-2xl font-bold" style={{ color: palette.charcoal }}>
          Ready to book?
        </h2>
        <p className="mt-3 text-base leading-7" style={{ color: palette.body }}>
          Contact Miqueas Language Solutions to discuss your specific needs and get a customized quote.
        </p>
        <Link to="/contact" className="btn btn-primary mt-6 inline-flex items-center gap-2">
          Request a Quote
        </Link>
      </div>
    </div>
  );
}
