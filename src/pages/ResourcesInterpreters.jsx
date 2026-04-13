export default function ResourcesInterpreters({ palette }) {
  return (
    <div>
      <h2
        className="mb-6 text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: palette.charcoal }}
      >
        Resources for Interpreters
      </h2>

      <p
        className="mb-6 max-w-3xl text-base leading-7 md:text-lg"
        style={{ color: "#5f5f5f" }}
      >
        If you are an interpreter who values clear, ethical, and effective communication,
        this section is here to connect you with helpful professional resources and an opportunity
        to learn more about working with us.
      </p>

      <h3 className="mt-8 text-2xl font-bold" style={{ color: palette.charcoal }}>
        Join Us
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        We are always open to connecting with qualified interpreters who care deeply about
        communication access, professionalism, and strong service delivery. Whether your experience
        is primarily in community, medical, educational, or remote interpreting, we would love
        to hear from you.
      </p>

      <div className="mt-4">
        <a
          href="https://forms.gle/cFTE9Qy1c3sFPdnz8"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: palette.burgundy }}
        >
          Join Us
        </a>
      </div>

      <h3 className="mt-8 text-2xl font-bold" style={{ color: palette.charcoal }}>
        Professional standards and helpful resources
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        Professional growth is strengthened by staying connected to the standards, guidance,
        and resources that shape effective interpreting practice.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <a
          href="https://rid.org/ethics/code-of-professional-conduct/"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            RID Code of Professional Conduct
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Review the core ethical standards that guide professional interpreting practice.
          </div>
        </a>

        <a
          href="https://rid.org/resources/#spp"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            RID Standard Practice Papers (SPPs)
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Explore practice guidance for different interpreting settings and service considerations.
          </div>
        </a>

        <a
          href="https://rid.org/"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            Registry of Interpreters for The Deaf
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Access certification information, professional development resources, and industry updates.
          </div>
        </a>

        <a
          href="https://naiedu.org/codeofethics/"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            NAIE Code of Ethics
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Familiarize yourself with the ethical standards and practices of interpreters working in K-12 settings.
          </div>
        </a>
      </div>
    </div>
  );
}