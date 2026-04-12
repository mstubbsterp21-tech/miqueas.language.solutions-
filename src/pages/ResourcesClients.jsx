export default function ResourcesClients({ palette }) {
  return (
    <div>
      <h2
        className="mb-6 text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: palette.charcoal }}
      >
        Working With an ASL Interpreter
      </h2>

      <p
        className="mb-6 max-w-3xl text-base leading-7 md:text-lg"
        style={{ color: "#5f5f5f" }}
      >
        If you have never worked with an interpreter before, that is completely normal.
        This page is here to help you better understand what language access looks like,
        why it matters, and how to create a smoother, more effective interaction for everyone involved.
      </p>

      <h3 className="mt-8 text-2xl font-bold" style={{ color: palette.charcoal }}>
        Why language access matters
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        Communication is about more than just exchanging words. It is about making sure
        that everyone involved fully understands what is being said and has the opportunity
        to participate. When Deaf individuals use American Sign Language (ASL), working with
        a qualified interpreter helps ensure that communication is accurate, complete, and accessible.
      </p>

      <h3 className="mt-6 text-2xl font-bold" style={{ color: palette.charcoal }}>
        Understanding your responsibilities
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        In many settings, especially in healthcare, education, employment, and public services,
        providing effective communication is not optional. Accessibility is part of making sure
        that people are able to fully engage, ask questions, receive information clearly, and
        make informed decisions without communication barriers.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <a
          href="https://www.ada.gov/law-and-regs/ada/"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            Americans with Disabilities Act (ADA)
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Learn more about federal requirements related to accessibility and effective communication.
          </div>
        </a>

        <a
          href="https://sites.ed.gov/idea/"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            Individuals with Disabilities Education Act (IDEA)
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Review educational access requirements and protections for students with disabilities.
          </div>
        </a>

        <a
          href="https://www.dol.gov/agencies/oasam/centers-offices/civil-rights-center/statutes/rehabilitation-act-of-1973"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-5 transition hover:shadow-md md:col-span-2"
          style={{ borderColor: palette.border }}
        >
          <div className="mb-2 font-semibold" style={{ color: palette.charcoal }}>
            Rehabilitation Act of 1973
          </div>
          <div className="text-sm leading-6" style={{ color: "#5f5f5f" }}>
            Explore another foundational law related to accessibility, nondiscrimination, and equal access.
          </div>
        </a>
      </div>

      <h3 className="mt-8 text-2xl font-bold" style={{ color: palette.charcoal }}>
        Interpreting and translation are not the same
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        These services are often confused, but they serve different purposes. Interpreting
        happens in real time during live communication, such as meetings, appointments, trainings,
        and events. Translation involves converting written material from one language to another,
        such as documents, policies, forms, or recorded content.
      </p>

      <h3 className="mt-6 text-2xl font-bold" style={{ color: palette.charcoal }}>
        Why qualified services matter
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        A qualified interpreter does more than simply relay words. They are responsible for
        conveying meaning, tone, and intent as accurately as possible so that communication
        remains clear and effective. This helps ensure that everyone involved can fully understand,
        respond appropriately, and participate with confidence.
      </p>

      <h3 className="mt-6 text-2xl font-bold" style={{ color: palette.charcoal }}>
        How to work effectively with an interpreter
      </h3>
      <p className="mt-2 text-sm leading-7" style={{ color: "#5f5f5f" }}>
        The best interpreted interactions feel natural. Speak directly to the Deaf individual,
        maintain a comfortable pace, and allow time for interpretation before expecting a response.
        If you are able to share materials in advance, that can also help create a smoother experience.
        If anything is unclear during the interaction, it is always okay to ask for clarification.
      </p>
    </div>
  );
}