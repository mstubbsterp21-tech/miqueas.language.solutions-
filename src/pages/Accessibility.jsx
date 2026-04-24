export default function Accessibility({ palette }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-20">
      <div className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-10" style={{ borderColor: palette.border }}>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
          Accessibility Statement
        </h1>

        <div className="mt-6 space-y-6 text-base leading-8" style={{ color: palette.body }}>
          <p>
            Miqueas Language Solutions is committed to providing a website that is accessible to
            as many people as possible, including individuals who are Deaf, hard of hearing, or
            have other communication needs.
          </p>

          <p>
            We strive to design and maintain our website in a way that supports usability,
            readability, and access across devices and assistive technologies.
          </p>

          <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>
            Ongoing Efforts
          </h2>
          <p>
            We are continually working to improve accessibility and usability. This includes
            reviewing layout, contrast, navigation, and overall user experience.
          </p>

          <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>
            Need Assistance?
          </h2>
          <p>
            If you experience any difficulty accessing content on this website, we encourage you
            to contact us. We will make every reasonable effort to provide the information or
            service you need in an accessible format.
          </p>
        </div>
      </div>
    </div>
  );
}
