import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Globe,
  Stethoscope,
  GraduationCap,
  Users,
  Video,
} from 'lucide-react';

function UseCaseList({ title, items, palette }) {
  return (
    <div
      className="rounded-[2rem] border p-5 md:p-8"
      style={{ borderColor: palette.border, backgroundColor: palette.white }}
    >
      <h3 className="text-xl font-bold md:text-2xl" style={{ color: palette.charcoal }}>
        {title}
      </h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ backgroundColor: palette.softGray }}
          >
            <CheckCircle2 size={18} style={{ color: palette.gold, marginTop: 2, flexShrink: 0 }} />
            <span className="text-sm leading-6" style={{ color: palette.body }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Services({ palette }) {
  const serviceCards = [
    {
      id: 'in-person-interpreting',
      icon: Users,
      title: 'In‑Person Interpreting',
      text: 'On-site communication access for appointments, meetings, events, and live environments where presence, visibility, and nuance matter.',
      label: 'On-site • High-context • Live interaction',
    },
    {
      id: 'video-remote-interpreting',
      icon: Video,
      title: 'Video Remote Interpreting',
      text: 'Real-time ASL access for telehealth, virtual meetings, short-notice requests, and remote communication across locations.',
      label: 'Remote • Flexible • Real-time access',
    },
    {
      id: 'english-asl-translation',
      icon: Globe,
      title: 'English → ASL Translation',
      text: 'Recorded ASL video translation for information that needs to be clearly and naturally communicated to Deaf viewers.',
      label: 'Recorded • Accessible • Audience-focused',
    },
    {
      id: 'asl-english-translation',
      icon: Globe,
      title: 'ASL → English Translation',
      text: 'English transcripts, captions, summaries, or documentation-ready outputs created from ASL source content.',
      label: 'Documentation • Clarity • Reusable content',
    },
  ];

  const specialtyCards = [
    { icon: Stethoscope, title: 'Medical' },
    { icon: GraduationCap, title: 'Educational' },
    { icon: BriefcaseBusiness, title: 'Business' },
    { icon: Users, title: 'Community' },
  ];

  const comparisonRows = [
    {
      label: 'Best fit',
      values: [
        'Live, on-site interactions with room dynamics or higher stakes',
        'Remote meetings and appointments with strong platform setup',
        'English content that needs accessible ASL video delivery',
        'ASL content that needs an English transcript, caption, or written output',
      ],
    },
    {
      label: 'Typical workflow',
      values: [
        'Request → logistics review → on-site delivery',
        'Request → platform check → live virtual delivery',
        'Source review → translation planning → record/edit/deliver',
        'Source review → output planning → translate/format/deliver',
      ],
    },
    {
      label: 'Public pricing structure',
      values: [
        'Setting-based hourly rates with 2-hour minimum',
        'Remote hourly rates with 1-hour minimum',
        'Project-based quote after source review',
        'Project-based quote after source review',
      ],
    },
  ];

  const useCases = [
    'A medical office needs on-site support for a specialist appointment with complex terminology and multiple participants.',
    'A company needs VRI for a remote meeting involving Deaf and hearing staff across different locations.',
    'A healthcare organization wants patient education materials turned into clear, polished ASL video.',
    'An employer has ASL video responses or messages that need to become transcripts, captions, or English summaries.',
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
      <section className="rounded-[2rem] border p-5 shadow-sm md:rounded-[2.25rem] md:p-12" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
          Services
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
          Communication support designed with more depth, more clarity, and a better fit for the assignment.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 md:text-lg md:leading-8" style={{ color: palette.body }}>
          Miqueas Language Solutions offers interpreting and translation services for clients who want more than generic coverage. Each service is structured around assignment fit, preparation, and a clear workflow so you know what to expect before the request is ever placed.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {specialtyCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium"
                style={{ borderColor: palette.border, backgroundColor: palette.softGray, color: palette.charcoal }}
              >
                <Icon size={16} style={{ color: palette.gold }} />
                {item.title}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-10 grid gap-5 md:mt-12 md:gap-6 md:grid-cols-2 xl:grid-cols-4">
        {serviceCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-[1.5rem] border p-5 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)] md:rounded-[1.75rem] md:p-6"
              style={{ backgroundColor: palette.white, borderColor: palette.border }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                style={{ backgroundColor: palette.gold }}
              />

              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-md"
                style={{ backgroundColor: palette.softGray }}
              >
                <Icon size={22} style={{ color: palette.burgundy }} />
              </div>

              <h3 className="mt-5 text-xl font-semibold" style={{ color: palette.charcoal }}>
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-7" style={{ color: palette.body }}>
                {card.text}
              </p>
              <p
                className="mt-4 text-xs font-medium tracking-[0.04em] transition-all duration-300 group-hover:translate-x-0.5"
                style={{ color: palette.body, opacity: 0.72 }}
              >
                <span style={{ color: palette.gold }}>•</span>{' '}
                <span className="group-hover:opacity-100" style={{ color: palette.charcoal, opacity: 0.82 }}>
                  {card.label}
                </span>
              </p>

              <Link
                to={`/services/${card.id}`}
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
                style={{ color: palette.burgundy }}
              >
                Explore this service
                <ArrowRight size={16} className="transition-transform duration-500 ease-out group-hover:translate-x-1.5" />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-[2rem] border p-5 shadow-sm md:mt-14 md:p-7" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
          Compare your options
        </p>
        <h2 className="mt-3 text-2xl font-bold md:text-3xl" style={{ color: palette.charcoal }}>
          Which service is right for your request?
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7" style={{ color: palette.body }}>
          Every request still goes through the same quote form, but the service type changes the workflow, the preparation, and how pricing is structured. This comparison helps you choose the right starting point.
        </p>

        <div className="mt-8 hidden overflow-hidden rounded-[1.75rem] border md:block" style={{ borderColor: palette.border }}>
          <div className="grid grid-cols-5 text-sm font-semibold" style={{ backgroundColor: palette.softGray, color: palette.charcoal }}>
            <div className="border-r p-4" style={{ borderColor: palette.border }}>Category</div>
            <div className="border-r p-4" style={{ borderColor: palette.border }}>In‑Person</div>
            <div className="border-r p-4" style={{ borderColor: palette.border }}>VRI</div>
            <div className="border-r p-4" style={{ borderColor: palette.border }}>English → ASL</div>
            <div className="p-4">ASL → English</div>
          </div>

          {comparisonRows.map((row, rowIndex) => (
            <div
              key={row.label}
              className="grid grid-cols-5 text-sm"
              style={{
                backgroundColor: rowIndex % 2 === 0 ? palette.white : '#fbfbfb',
                color: palette.body,
              }}
            >
              <div className="border-r p-4 font-semibold" style={{ borderColor: palette.border, color: palette.charcoal }}>
                {row.label}
              </div>
              {row.values.map((value, index) => (
                <div
                  key={`${row.label}-${index}`}
                  className={`p-4 ${index < row.values.length - 1 ? 'border-r' : ''}`}
                  style={{ borderColor: palette.border }}
                >
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4 md:hidden">
          {serviceCards.map((card, cardIndex) => (
            <div
              key={card.title}
              className="rounded-[1.5rem] border p-5"
              style={{ borderColor: palette.border, backgroundColor: palette.softGray }}
            >
              <h3 className="text-lg font-semibold" style={{ color: palette.charcoal }}>
                {card.title}
              </h3>

              <div className="mt-4 space-y-4">
                {comparisonRows.map((row) => (
                  <div key={`${card.title}-${row.label}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: palette.gold }}>
                      {row.label}
                    </p>
                    <p className="mt-1 text-sm leading-6" style={{ color: palette.body }}>
                      {row.values[cardIndex]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:mt-14 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
        <UseCaseList title="Real-world use cases" items={useCases} palette={palette} />

        <div
          className="rounded-[2rem] p-5 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] md:p-7"
          style={{ backgroundColor: palette.charcoal }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
            Service approach
          </p>
          <h3 className="mt-3 text-2xl font-bold text-white">
            Every request still starts with the form.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Whether you need on-site interpreting, VRI, or translation services, the request form is always used so MLS can evaluate the assignment properly, align logistics, confirm fit, and quote the service clearly.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'The same request form is used for every service type',
              'Quotes are built around assignment details, not guesswork',
              'Rates and policy language are aligned before booking is confirmed',
              'Preparation and workflow vary by service, but the intake standard stays consistent',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 ease-out hover:bg-white/10 hover:border-white/20"
              >
                <span className="text-sm leading-6 text-white/85">{item}</span>
              </div>
            ))}
          </div>
          <Link to="/contact" className="btn btn-primary mt-7 inline-flex items-center gap-2">
            Request a Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
