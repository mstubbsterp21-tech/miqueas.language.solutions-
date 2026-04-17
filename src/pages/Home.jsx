import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion';

export default function Home({ palette }) {
  const stats = [
    ['7 Years', 'Professional interpreting experience'],
    ['Educational Interpreter Performance Assessment (EIPA)', 'Credentialed educational interpreting background'],
    ['Medical • Educational • Cruise • Community', 'Current specialties'],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
      <motion.div {...fadeUp} className="section-shell p-7 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-2 text-sm"
          style={{
            color: palette.charcoal,
            borderColor: palette.border,
            backgroundColor: palette.white,
          }}
        >
          <CheckCircle2 size={16} style={{ color: palette.gold }} />
          Based in Ocala, FL • Travel & remote services available
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl"
          style={{ color: palette.charcoal }}
        >
          Language access that feels professional, personal, and dependable.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-2xl text-lg md:text-xl"
          style={{ color: palette.body }}
        >
          Miqueas Language Solutions provides ASL ↔ English interpreting and
          translation services with the care, responsiveness, and professionalism clients
          deserve.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <Link
            to="/contact"
            className="btn btn-primary inline-flex flex-1 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition sm:flex-none"
          >
            Request a Quote <ArrowRight size={16} />
          </Link>

          <Link
            to="/services"
            className="btn btn-secondary inline-flex flex-1 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:bg-black/5 sm:flex-none"
          >
            Explore Services
          </Link>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {stats.map(([stat, label]) => (
            <motion.div
              key={stat}
              variants={staggerItem}
              transition={{ duration: 0.45 }}
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
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
