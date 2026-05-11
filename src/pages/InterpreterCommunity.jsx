const groups = [
  {
    name: "MLS Announcements",
    description:
      "Official updates from Miqueas Language Solutions, including roster reminders, onboarding notes, policy updates, training opportunities, and important company announcements.",
  },
  {
    name: "MLS Assignment Opportunities",
    description:
      "Open interpreting opportunities shared with the MLS roster. Posts may include date, time, location or platform, setting, language needs, credential preferences, rate notes, and response instructions.",
  },
  {
    name: "MLS Florida Interpreters",
    description:
      "A statewide space for Florida-based interpreters. This group may include Florida assignment needs, regional updates, travel notes, and local coordination. City tags may be used for clarity.",
  },
  {
    name: "MLS Remote / VRI Assignments",
    description:
      "Remote and VRI interpreting opportunities, including platform details, technical expectations, and remote-readiness reminders.",
  },
  {
    name: "MLS CDI / DI Opportunities",
    description:
      "A dedicated space for Certified Deaf Interpreters and Deaf Interpreters, including CDI/DI assignment opportunities, team needs, and specialized communication access support.",
  },
  {
    name: "MLS General Discussion",
    description:
      "A professional community space for general questions, appropriate resource sharing, interpreter connection, and MLS roster support.",
  },
  {
    name: "MLS Ethics Discussion",
    description:
      "A reflective discussion space for ethics-related questions, professional judgment, case discussion, and respectful dialogue about interpreting decisions. Keep examples general and protect confidentiality at all times.",
  },
];

const rules = [
  {
    title: "Keep information confidential.",
    text:
      "Do not share client names, consumer names, assignment content, screenshots, recordings, links, documents, or private details in the group unless MLS has clearly authorized it for coordination.",
  },
  {
    title: "Use WhatsApp for quick communication only.",
    text:
      "WhatsApp is helpful for updates and opportunities, but formal assignment confirmations, payment details, documentation, and official decisions will still come directly from MLS.",
  },
  {
    title: "Reply only when you are available and appropriate for the assignment.",
    text:
      "Before responding to an opportunity, consider your availability, skill set, credentials, setting experience, communication mode, travel ability, and any possible conflict of interest.",
  },
  {
    title: "A reply does not confirm an assignment.",
    text:
      "Responding to a post only shows interest. An assignment is confirmed only when MLS contacts you directly with final details.",
  },
  {
    title: "Keep the tone professional.",
    text:
      "Be respectful, clear, and constructive. No gossip, arguments, personal attacks, public shaming, discriminatory comments, or undermining colleagues.",
  },
  {
    title: "Use the correct group.",
    text:
      "Post questions, replies, and resources in the group where they fit best. This helps keep notifications useful and prevents important information from getting buried.",
  },
  {
    title: "Do not use the community for unrelated promotion.",
    text:
      "Avoid posting unrelated services, spam, outside business promotions, or recruiting messages that are not connected to MLS or the interpreting profession.",
  },
  {
    title: "Share resources with care.",
    text:
      "Helpful workshops, professional resources, and interpreting-related opportunities are welcome when appropriate. Please avoid unverified information, copyrighted materials, or anything confidential.",
  },
  {
    title: "Bring concerns directly to MLS.",
    text:
      "If there is a concern about an assignment, access issue, safety matter, ethical question, technical problem, or payment/documentation issue, contact MLS directly instead of posting sensitive details in the group.",
  },
  {
    title: "MLS may remove posts or members when needed.",
    text:
      "MLS may remove posts or limit group access if something compromises confidentiality, professionalism, safety, trust, or the purpose of the community.",
  },
];

export default function InterpreterCommunity({ palette }) {
  return (
    <div className="bg-white text-center">
      <section className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24" style={{ background: `radial-gradient(circle at top left, ${palette.gold}55, transparent 30%), linear-gradient(135deg, ${palette.burgundy}, ${palette.charcoal})` }}>
        <div className="absolute left-1/2 top-8 h-32 w-32 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-white">
          <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.28em] backdrop-blur" style={{ color: palette.gold }}>
            Miqueas Language Solutions
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            MLS Interpreter Network Guidelines
          </h1>
          <div className="mt-5 h-1.5 w-28 rounded-full" style={{ backgroundColor: palette.gold }} />
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/85 md:text-lg">
            A private guide for interpreters connected with MLS. This page explains how the network is organized, what each group is for, and how we keep communication clear, respectful, and confidential.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-7 shadow-xl md:p-9" style={{ borderColor: palette.border }}>
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: palette.gold }}>Purpose</p>
            <h2 className="mt-3 text-3xl font-black" style={{ color: palette.charcoal }}>Why this network exists</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8" style={{ color: palette.body }}>
              The MLS Interpreter Network is designed to support quick communication, assignment visibility, interpreter connection, and professional coordination. It is not meant to replace direct communication with MLS or formal assignment confirmation.
            </p>
          </div>

          <section>
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: palette.gold }}>1. Community Rules</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black md:text-4xl" style={{ color: palette.charcoal }}>Standards for participation</h2>
            <div className="mx-auto mt-7 grid max-w-5xl gap-4 md:grid-cols-2">
              {rules.map((rule, index) => (
                <article key={rule.title} className="rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: palette.border }}>
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: palette.burgundy }}>
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{rule.title}</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7" style={{ color: palette.body }}>{rule.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: palette.gold }}>2. Group Descriptions</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black md:text-4xl" style={{ color: palette.charcoal }}>What each group is for</h2>
            <div className="mx-auto mt-7 grid max-w-5xl gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <article key={group.name} className="rounded-[1.5rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: palette.border }}>
                  <div className="mx-auto mb-4 h-1.5 w-16 rounded-full" style={{ backgroundColor: palette.gold }} />
                  <h3 className="text-xl font-black" style={{ color: palette.burgundy }}>{group.name}</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-7" style={{ color: palette.body }}>{group.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-4xl rounded-[2rem] p-8 text-white shadow-xl md:p-10" style={{ background: `linear-gradient(135deg, ${palette.charcoal}, ${palette.burgundy})` }}>
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: palette.gold }}>3. Direct Contact</p>
            <h2 className="mt-3 text-3xl font-black">When to contact MLS directly</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/80">
              Contact MLS directly for assignment-specific questions, urgent updates, ethical concerns, access concerns, documentation questions, payment issues, or anything that includes private or sensitive information.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="mailto:m.stubbs@miqueaslanguagesolutions.com" className="rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
                m.stubbs@miqueaslanguagesolutions.com
              </a>
              <a href="tel:+13213798010" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                (321) 379-8010
              </a>
            </div>
          </section>

          <p className="border-t pt-6 text-center text-xs" style={{ color: palette.body, borderColor: palette.border }}>
            © 2026 Miqueas Language Solutions. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
