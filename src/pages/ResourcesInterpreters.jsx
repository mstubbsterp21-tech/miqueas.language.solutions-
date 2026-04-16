import InterpreterNetworkForm from '../components/InterpreterNetworkForm';

export default function ResourcesInterpreters({ palette }) {
  return (
    <div className="space-y-10">
      <section
        className="rounded-[2rem] border p-6 shadow-sm md:p-8"
        style={{
          borderColor: palette.border,
          background: `linear-gradient(135deg, ${palette.white} 0%, ${palette.softGray} 100%)`,
        }}
      >
        <div
          className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            backgroundColor: `${palette.gold}14`,
            color: palette.gold,
          }}
        >
          For Interpreters
        </div>

        <h2
          className="mb-5 text-3xl font-bold tracking-tight md:text-4xl"
          style={{ color: palette.charcoal }}
        >
          Resources for Interpreters
        </h2>

        <p
          className="max-w-3xl text-base leading-7 md:text-lg"
          style={{ color: palette.body }}
        >
          If you are an interpreter who values clear, ethical, and effective communication,
          this section is here to connect you with helpful professional resources and an opportunity
          to learn more about working with us.
        </p>
      </section>

      <section
        className="rounded-[2rem] border p-6 shadow-sm md:p-8"
        style={{
          borderColor: palette.border,
          background: `linear-gradient(135deg, ${palette.burgundy}12 0%, ${palette.white} 100%)`,
        }}
      >
        <h3 className="text-2xl font-bold" style={{ color: palette.charcoal }}>
          Join Our Interpreter Network
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-7 md:text-base" style={{ color: palette.body }}>
          We are always open to connecting with qualified interpreters who care deeply about
          communication access, professionalism, and strong service delivery. Whether your experience
          is primarily in community, medical, educational, or remote interpreting, we would love
          to hear from you.
        </p>
      </section>

      <InterpreterNetworkForm palette={palette} />

      <section className="space-y-8">
        <div>
          <h3 className="text-2xl font-bold" style={{ color: palette.charcoal }}>
            Professional standards and helpful resources
          </h3>
          <p className="mt-3 max-w-4xl text-sm leading-7 md:text-base" style={{ color: palette.body }}>
            Professional growth is strengthened by staying connected to the standards, guidance,
            and resources that shape effective interpreting practice.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="https://rid.org/ethics/code-of-professional-conduct/"
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.white,
            }}
          >
            <div
              className="mb-3 h-1.5 w-16 rounded-full"
              style={{ backgroundColor: palette.gold }}
            />
            <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
              RID Code of Professional Conduct
            </div>
            <div className="text-sm leading-6" style={{ color: palette.body }}>
              Review the core ethical standards that guide professional interpreting practice.
            </div>
          </a>

          <a
            href="https://rid.org/resources/#spp"
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.white,
            }}
          >
            <div
              className="mb-3 h-1.5 w-16 rounded-full"
              style={{ backgroundColor: palette.gold }}
            />
            <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
              RID Standard Practice Papers (SPPs)
            </div>
            <div className="text-sm leading-6" style={{ color: palette.body }}>
              Explore practice guidance for different interpreting settings and service considerations.
            </div>
          </a>

          <a
            href="https://rid.org/"
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.white,
            }}
          >
            <div
              className="mb-3 h-1.5 w-16 rounded-full"
              style={{ backgroundColor: palette.gold }}
            />
            <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
              Registry of Interpreters for The Deaf
            </div>
            <div className="text-sm leading-6" style={{ color: palette.body }}>
              Access certification information, professional development resources, and industry updates.
            </div>
          </a>

          <a
            href="https://naiedu.org/codeofethics/"
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.white,
            }}
          >
            <div
              className="mb-3 h-1.5 w-16 rounded-full"
              style={{ backgroundColor: palette.gold }}
            />
            <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
              NAIE Code of Ethics
            </div>
            <div className="text-sm leading-6" style={{ color: palette.body }}>
              Familiarize yourself with the ethical standards and practices of interpreters working in K-12 settings.
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
