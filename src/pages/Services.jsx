import { Link } from 'react-router-dom';
import { Users, Video, Globe, Stethoscope, GraduationCap, Ship, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion';

export default function Services({ palette }) {
  const serviceCards = [
    { id: 'in-person-interpreting', icon: Users, title: 'In‑Person Interpreting', text: 'Professional ASL interpreting services for on-site assignments across a variety of settings.' },
    { id: 'video-remote-interpreting', icon: Video, title: 'Video Remote Interpreting', text: 'Reliable interpreting for virtual meetings, appointments, and remote communication needs.' },
    { id: 'english-asl-translation', icon: Globe, title: 'English → ASL Translation (Video)', text: 'Recorded video translations from English into ASL for accessible communication.' },
    { id: 'asl-english-translation', icon: Globe, title: 'ASL → English Translation', text: 'Captioned video or written/spoken transcription of ASL content into English.' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
      <motion.div {...fadeUp}>
        <h1 className="mb-6 text-3xl font-bold md:text-4xl" style={{ color: palette.charcoal }}>
          Practical language support across remote and in-person settings
        </h1>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        >
          {serviceCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={staggerItem}>
                <Link
                  to={`/services/${card.id}`}
                  className="group rounded-[1.75rem] border p-6 shadow-sm transition hover:shadow-md"
                  style={{ backgroundColor: palette.white, borderColor: palette.border }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: palette.softGray }}>
                    <Icon size={22} style={{ color: palette.burgundy }} />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold" style={{ color: palette.charcoal }}>
                    {card.title}
                  </h3>

                  <p className="mt-3 text-sm" style={{ color: palette.body }}>
                    {card.text}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color: palette.burgundy }}>
                    Learn More <ArrowRight size={16} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
