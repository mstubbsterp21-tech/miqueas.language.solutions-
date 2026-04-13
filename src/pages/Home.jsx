import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home({ palette }) {
  const stats = [
    ['7 Years', 'Professional interpreting experience'],
    ['EIPA', 'Credentialed educational interpreting background'],
    ['Medical • Educational • Cruise • Community', 'Current specialties'],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="section-shell p-7 md:p-10"
      >
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
          style={{
            color: palette.charcoal,
            borderColor: palette.border,
            backgroundColor: palette.white,
          }}
        >
          <CheckCircle2 size={16} style={{ color: palette.gold }} />
          Based in Ocala, FL • Travel & remote services available
        </div>

        <h1
          className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl"
          style={{ color: palette.charcoal }}
        >
          Language access that feels professional, personal, and dependable.
        </h1>

        <p
          className="mt-6 max-w-2xl text-lg md:text-xl"
          style={{ color: palette.body }}
        >
          Miqueas Language Solutions provides ASL ↔ English interpreting and ASL video
          translation services with the care, responsiveness, and professionalism clients
          deserve.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/contact"
            className="btn btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition"
          >
            Request a Quote <ArrowRight size={16} />
          </Link>

          <Link
            to="/services"
            className="btn btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:bg-black/5"
          >
            Explore Services
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map(([stat, label]) => (
            <div
              key={stat}
              className="rounded-3xl border p-5 shadow-sm"
              style={{
                backgroundColor: palette.white,
                borderColor: palette.border,
              }}
            >
              <div className="text-lg font-bold" style={{ color: palette.burgundy }}>
                {stat}
              </div>
              <div className="mt-2 text-sm leading-6" style={{ color: palette.body }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}