import { Link } from 'react-router-dom';
import { Users, Video, Globe, Stethoscope, GraduationCap, Ship, ArrowRight } from 'lucide-react';

export default function Services({ palette }) {
  // Define information for service cards and specialties.
  const serviceCards = [
    {
      id: 'in-person-interpreting',
      icon: Users,
      title: 'In‑Person Interpreting',
      text: 'Professional ASL interpreting services for on-site assignments across a variety of settings.',
      certifications: 'EIPA; RID-aligned practices; ongoing professional development',
      examples: 'Hospital intake, clinic appointments, parent‑teacher meetings, community events',
      rates: 'Typical range: $60–$120/hr (varies with setting, travel, and prep)',
    },
    {
      id: 'video-remote-interpreting',
      icon: Video,
      title: 'Video Remote Interpreting',
      text: 'Reliable interpreting for virtual meetings, appointments, and remote communication needs.',
      certifications: 'Remote interpreting best practices; HIPAA-aware for medical settings',
      examples: 'Telehealth visits, remote meetings, brief virtual consultations',
      rates: 'Typical range: $40–$90/hr (lower minimums for short sessions)',
    },
    {
      id: 'english-asl-translation',
      icon: Globe,
      title: 'English → ASL Translation (Video)',
      text: 'Recorded video translations from English into ASL for accessible communication.',
      certifications: 'Experience producing clear ASL narrative translations; video captioning knowledge',
      examples: 'Patient education videos, informational content, short training clips',
      rates: 'Project-based; samples often start around $150+ depending on length and editing',
    },
    {
      id: 'asl-english-translation',
      icon: Globe,
      title: 'ASL → English Translation',
      text: 'Captioned video or written/spoken transcription of ASL content into English.',
      certifications: 'Transcription and caption review experience; accuracy-focused workflow',
      examples: 'Event recordings, ASL interviews, classroom content transcription',
      rates: 'Typical range: $45–$95/hr (depends on turnaround and complexity)',
    },
  ];

  const specialtyCards = [
    { icon: Stethoscope, title: 'Medical' },
    { icon: GraduationCap, title: 'Educational' },
    { icon: Ship, title: 'Cruise' },
    { icon: Users, title: 'Community' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-20">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>
        Practical language support across remote and in-person settings
      </h1>
      <p className="mb-10 max-w-3xl text-base md:text-lg" style={{ color: palette.body }}>
        Whether the need is virtual, on-site, or recorded, services are designed to make communication access feel
        smoother, more human, and more dependable.
      </p>

      {/* Service cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {serviceCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={`/services/${card.id}`}
              className="group rounded-[1.75rem] border p-6 shadow-sm transition hover:shadow-md"
              style={{ backgroundColor: palette.white, borderColor: palette.border }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
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

              <div className="mt-3 text-sm leading-6" style={{ color: palette.body }}>
                {card.certifications && (
                  <div>
                    <strong style={{ color: palette.charcoal }}>Certifications:</strong> {card.certifications}
                  </div>
                )}

                {card.examples && (
                  <div className="mt-1">
                    <strong style={{ color: palette.charcoal }}>Example assignments:</strong> {card.examples}
                  </div>
                )}

                {card.rates && (
                  <div className="mt-1">
                    <strong style={{ color: palette.charcoal }}>Typical rates:</strong> {card.rates}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color: palette.burgundy }}>
                Learn More <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        {/* Specialties section */}
        <div
          className="rounded-[2rem] border p-7 shadow-sm"
          style={{ backgroundColor: palette.white, borderColor: palette.border }}
        >
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            style={{ color: palette.gold }}
          >
            Specialties
          </p>
          <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
            Focused experience where accuracy and trust matter most
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {specialtyCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-2xl p-4"
                  style={{ backgroundColor: palette.softGray }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: palette.gold, color: '#ffffff' }}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="font-medium" style={{ color: palette.charcoal }}>
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service approach section */}
        <div className="rounded-[2rem] p-7 shadow-sm" style={{ backgroundColor: palette.charcoal }}>
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em]"
            style={{ color: palette.gold }}
          >
            Service approach
          </p>
          <h3 className="mt-3 text-2xl font-bold text-white">
            Built for clients who want more than just coverage
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Miqueas Language Solutions is designed for clients who want professional support without feeling
            shuffled through a generic system. Every inquiry is handled with attention to logistics, communication
            needs, and assignment fit.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'Quotes provided based on assignment details',
              'Rates and policies shared privately upon inquiry',
              'Travel considered case by case from Ocala, Florida',
              'Remote services available for qualifying requests',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <span className="text-sm leading-6 text-white/85">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
