const groups = [
  {
    name: "MLS Announcements",
    purpose:
      "Official updates from Miqueas Language Solutions, including policy reminders, roster updates, training opportunities, onboarding notes, and important operational announcements.",
    use:
      "This group is admin-only so information stays clear, consistent, and easy to find.",
  },
  {
    name: "MLS Assignment Opportunities",
    purpose:
      "Open assignment opportunities for MLS interpreters. Posts may include date, time, location or platform, setting, language/modality needs, rate information, credential requirements, and response instructions.",
    use:
      "Reply only when you are available, qualified, and ready to be considered. Assignment claims are not confirmed until MLS sends direct confirmation.",
  },
  {
    name: "MLS Florida Interpreters",
    purpose:
      "A statewide space for Florida-based interpreters and Florida assignment coordination. This group may include on-site opportunities, regional needs, travel considerations, and Florida-specific updates.",
    use:
      "City or region tags may be used to keep opportunities clear, such as [Ocala], [Orlando], [Tampa], [Miami], [Jacksonville], or [Southwest FL].",
  },
  {
    name: "MLS Remote / VRI Assignments",
    purpose:
      "A space for remote interpreting opportunities and VRI-related communication, including platform details, technical expectations, remote readiness, and virtual assignment needs.",
    use:
      "Interpreters should only respond when they have the required equipment, stable internet, appropriate environment, and skill set for the assignment.",
  },
  {
    name: "MLS CDI / DI Opportunities",
    purpose:
      "A dedicated space for Certified Deaf Interpreters and Deaf Interpreters, including CDI/DI assignment opportunities, teaming needs, and specialized access support.",
    use:
      "This group supports effective communication access when Deaf interpreter expertise, language matching, cultural mediation, or specialized teaming may be needed.",
  },
  {
    name: "MLS Interpreter Community",
    purpose:
      "A professional community space for approved interpreters to ask general questions, share appropriate resources, support one another, and stay connected with MLS.",
    use:
      "Keep discussion professional, relevant, respectful, and free from confidential assignment details.",
  },
];

const rules = [
  {
    title: "Protect confidentiality at all times.",
    text:
      "Do not share client names, consumer names, assignment content, medical/legal/educational details, screenshots, recordings, links, documents, or private communications unless MLS has specifically authorized it for coordination purposes. When in doubt, keep it general and contact MLS directly.",
  },
  {
    title: "Use the right group for the right purpose.",
    text:
      "Announcements are for official MLS updates. Assignment groups are for availability and coordination. Community discussion should stay professional and relevant to interpreting, access, MLS operations, and roster support.",
  },
  {
    title: "Do not treat a WhatsApp reply as a confirmed assignment.",
    text:
      "Responding to an opportunity only shows interest or availability. An assignment is confirmed only when MLS sends direct confirmation with the final details.",
  },
  {
    title: "Accept only what you are qualified and ready to do.",
    text:
      "Before responding to an assignment, consider the setting, consumers, language needs, modality, credentials, preparation needs, conflicts of interest, physical/emotional readiness, and whether team or CDI/DI support may be needed.",
  },
  {
    title: "Keep communication professional and respectful.",
    text:
      "MLS expects courteous, clear, and constructive communication. No harassment, gossip, personal attacks, public shaming, discriminatory comments, or undermining colleagues.",
  },
  {
    title: "Do not advertise unrelated services or solicit MLS contacts.",
    text:
      "This community is for MLS-related interpreting communication. Do not use the groups to promote unrelated businesses, recruit for competing work, collect interpreter contact lists, or contact MLS clients outside approved channels.",
  },
  {
    title: "Share resources carefully.",
    text:
      "Professional resources, workshops, and interpreting-related opportunities are welcome when relevant. Avoid posting unverified claims, confidential materials, copyrighted content, or anything that could compromise consumers, clients, interpreters, or MLS.",
  },
  {
    title: "Respect boundaries and response times.",
    text:
      "WhatsApp helps MLS communicate quickly, but it does not create a 24/7 obligation for interpreters. Urgent matters should be handled directly with MLS using the contact method provided for that situation.",
  },
  {
    title: "Report concerns directly to MLS.",
    text:
      "If you notice a confidentiality concern, safety issue, access barrier, ethical concern, conflict of interest, technical failure, or assignment problem, contact MLS directly instead of debating it in the group.",
  },
  {
    title: "MLS may remove members or limit access.",
    text:
      "MLS may remove a member from a group or limit community access for confidentiality concerns, unprofessional conduct, misuse of information, repeated off-topic posting, inaccurate credential claims, or behavior that conflicts with MLS standards.",
  },
];

export default function InterpreterCommunity({ palette }) {
  return (
    <div className="bg-white">
      <section className="px-4 py-16 md:px-8 md:py-24" style={{ background: `linear-gradient(135deg, ${palette.burgundy}, ${palette.charcoal})` }}>
        <div className="mx-auto max-w-5xl text-white">
          <div className="mb-5 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em]" style={{ backgroundColor: palette.gold }}>
            Private Interpreter Community
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            MLS WhatsApp Community Guidelines
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/82 md:text-lg">
            This private community is for interpreters connected with Miqueas Language Solutions. It exists to support clear communication, ethical coordination, assignment opportunities, and a professional roster culture rooted in access, respect, and trust.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="rounded-[2rem] border p-6 md:p-8" style={{ borderColor: palette.border, backgroundColor: palette.softGray }}>
            <h2 className="text-2xl font-bold" style={{ color: palette.charcoal }}>Before You Post</h2>
            <p className="mt-4 leading-8" style={{ color: palette.body }}>
              Please remember that WhatsApp is a coordination tool, not the official assignment record. Formal assignment details, confirmations, documentation, payment terms, and policy decisions must still come directly from MLS through the appropriate channel.
            </p>
            <p className="mt-4 leading-8" style={{ color: palette.body }}>
              All members are expected to protect confidentiality, maintain professional boundaries, and communicate in a way that reflects the standards of the interpreting profession and the values of MLS.
            </p>
          </div>

          <div>
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: palette.gold }}>Community Rules</p>
              <h2 className="mt-2 text-3xl font-bold" style={{ color: palette.charcoal }}>How we keep this space useful and professional</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map((rule, index) => (
                <article key={rule.title} className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: palette.border }}>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: palette.charcoal }}>{rule.title}</h3>
                  <p className="mt-3 text-sm leading-7" style={{ color: palette.body }}>{rule.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: palette.gold }}>Group Descriptions</p>
              <h2 className="mt-2 text-3xl font-bold" style={{ color: palette.charcoal }}>What each WhatsApp group is for</h2>
            </div>
            <div className="space-y-4">
              {groups.map((group) => (
                <article key={group.name} className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: palette.border }}>
                  <h3 className="text-xl font-bold" style={{ color: palette.burgundy }}>{group.name}</h3>
                  <p className="mt-3 leading-7" style={{ color: palette.body }}>{group.purpose}</p>
                  <p className="mt-3 rounded-2xl p-4 text-sm leading-7" style={{ backgroundColor: palette.softGray, color: palette.body }}>
                    <strong style={{ color: palette.charcoal }}>Best use: </strong>{group.use}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <section className="rounded-[2rem] p-6 text-white md:p-8" style={{ background: `linear-gradient(135deg, ${palette.charcoal}, ${palette.burgundy})` }}>
            <h2 className="text-2xl font-bold">Need help or have a concern?</h2>
            <p className="mt-4 max-w-3xl leading-8 text-white/80">
              For assignment-specific questions, ethical concerns, access concerns, payment/documentation questions, or urgent coordination needs, contact MLS directly instead of posting sensitive details in the community.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="mailto:m.stubbs@miqueaslanguagesolutions.com" className="rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
                Email MLS
              </a>
              <a href="tel:+13213798010" className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                Call MLS
              </a>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
