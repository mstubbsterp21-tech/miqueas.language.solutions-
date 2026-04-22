import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  MonitorSmartphone,
  Quote,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeUp, staggerContainer, staggerItem } from '../lib/motion';

export default function Home({ palette }) {
  const stats = [
    ['7+ Years', 'Professional interpreting experience across diverse real-world settings'],
    ['EIPA 3.9', 'Credentialed educational interpreting background with ongoing professional development'],
    ['Medical • Educational • Business • Community', 'Service areas designed for organizations that need dependable access'],
  ];

  const sectors = [
    {
      icon: Stethoscope,
      label: 'Medical',
      description: 'Support for appointments, consultations, and healthcare interactions where clarity and accuracy matter.',
    },
    {
      icon: Building2,
      label: 'Educational',
      description: 'Interpreting for classroom settings, meetings, and school-based communication access needs.',
    },
    {
      icon: BriefcaseBusiness,
      label: 'Business',
      description: 'Professional access for workplace meetings, trainings, interviews, and organizational communication.',
    },
    {
      icon: Users,
      label: 'Community',
      description: 'Language access for social services, public events, and everyday interactions in the community.',
    },
  ];

  const testimonials = [
    {
      quote:
        "Micah is very involved in the interpreting field and Deaf community. He consistently makes every effort to adapt to the needs of his Deaf consumers, appropriately anticipates my needs, and follows through.",
      attribution: 'Jasmin',
      role: 'Deaf Consumer',
    },
    {
      quote:
        "Micah is a highly intelligent, motivated, and skilled interpreter. He is respectful, professional, and actively seeks ways to continue learning and growing. You will have no regrets in hiring Micah Stubbs.",
      attribution: 'Glenda A. Foster, NIC',
      role: 'Professional Reference',
    },
    {
      quote:
        "Micah is professional and competent. He works well as part of an interpreting team, communicates well about consumer needs, and demonstrates humility by continuing to learn without going beyond the scope of his skills and experience.",
      attribution: 'Allyssa Blue',
      role: 'Interpreting Colleague',
    },
  ];

  const highlights = ['In-Person & Remote', 'Based in Florida', 'Travel Available', 'Professional Service'];

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top left, ${palette.gold}18 0%, transparent 32%), radial-gradient(circle at 85% 18%, ${palette.burgundy}14 0%, transparent 24%), linear-gradient(180deg, #fffaf4 0%, #ffffff 52%, #f8f8f8 100%)`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <motion.section
          {...fadeUp}
          className="relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_25px_80px_rgba(0,0,0,0.08)] md:p-10"
          style={{
            borderColor: `${palette.gold}22`,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,248,240,0.98) 40%, rgba(255,255,255,0.98) 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: `${palette.gold}1f` }}
          />
          <div
            className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: `${palette.burgundy}16` }}
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  color: palette.charcoal,
                  borderColor: `${palette.gold}33`,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                }}
              >
                <BadgeCheck size={16} style={{ color: palette.gold }} />
                Professional ASL-English Interpreting
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl"
                style={{ color: palette.charcoal }}
              >
                Professional ASL-English Interpreting for Organizations That Can’t Afford Miscommunication
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-6 max-w-3xl text-lg leading-8 md:text-xl"
                style={{ color: palette.body }}
              >
                Miqueas Language Solutions delivers dependable language access for medical,
                educational, business, and community settings through professional ASL-English
                interpreting services—offered in person and remotely with a community-rooted,
                client-focused approach.
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
                  className="btn btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold shadow-lg shadow-black/10 transition sm:flex-none"
                >
                  Request an Interpreter <ArrowRight size={16} />
                </Link>

                <Link
                  to="/resources/interpreters"
                  className="btn btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold shadow-lg shadow-black/10 transition sm:flex-none"
                >
                  Join the Interpreter Roster <ArrowRight size={16} />
                </Link>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {highlights.map((item) => (
                  <motion.div
                    key={item}
                    variants={staggerItem}
                    className="rounded-full border px-4 py-2 text-sm font-medium"
                    style={{
                      color: palette.charcoal,
                      borderColor: `${palette.gold}26`,
                      backgroundColor: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {item}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative"
            >
              <div
                className="overflow-hidden rounded-[2rem] border p-6 shadow-[0_18px_50px_rgba(0,0,0,0.10)] md:p-7"
                style={{
                  borderColor: `${palette.gold}25`,
                  background: `linear-gradient(160deg, ${palette.charcoal} 0%, #2d2d2d 100%)`,
                }}
              >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm uppercase tracking-[0.2em] text-white/60">
                      Miqueas Language Solutions
                    </div>
                    <div className="mt-2 text-2xl font-semibold leading-tight text-white">
                      Clear communication. Professional presence. Reliable access.
                    </div>
                  </div>
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: palette.gold }}
                  >
                    <MonitorSmartphone size={24} color="#ffffff" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {sectors.map(({ icon: Icon, label, description }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    >
                      <Icon size={18} style={{ color: palette.gold }} />
                      <div className="mt-3 text-base font-semibold text-white">{label}</div>
                      <div className="mt-1 text-sm leading-6 text-white/70">{description}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-medium text-white/60">Why organizations choose MLS</div>
                  <div className="mt-3 text-lg font-semibold leading-8 text-white">
                    A premium, personable experience that helps clients feel supported—not processed.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="relative mt-10 grid gap-4 sm:grid-cols-3"
          >
            {stats.map(([stat, label]) => (
              <motion.div
                key={stat}
                variants={staggerItem}
                transition={{ duration: 0.45 }}
                className="rounded-3xl border p-5 shadow-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.78)',
                  borderColor: `${palette.gold}20`,
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
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="mt-12 rounded-[2rem] border p-6 shadow-sm md:mt-14 md:p-10"
          style={{
            borderColor: `${palette.gold}20`,
            backgroundColor: 'rgba(255,255,255,0.82)',
          }}
        >
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
              style={{
                color: palette.charcoal,
                borderColor: `${palette.gold}33`,
                backgroundColor: 'rgba(255,255,255,0.8)',
              }}
            >
              <Quote size={16} style={{ color: palette.gold }} />
              Trusted by consumers and colleagues
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>
              What others are saying about Micah
            </h2>
            <p className="mt-4 text-base leading-7 md:text-lg" style={{ color: palette.body }}>
              These references speak to professionalism, adaptability, and a strong commitment to both the Deaf community and the interpreting field.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.attribution}
                variants={staggerItem}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="h-full rounded-[1.75rem] border p-6 shadow-sm"
                style={{
                  borderColor: `${palette.gold}18`,
                  backgroundColor: palette.white,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${palette.gold}16` }}
                >
                  <Quote size={18} style={{ color: palette.burgundy }} />
                </div>

                <p className="mt-5 text-sm leading-7 md:text-base" style={{ color: palette.body }}>
                  “{testimonial.quote}”
                </p>

                <div className="mt-6 border-t pt-4" style={{ borderColor: palette.border }}>
                  <div className="text-base font-semibold" style={{ color: palette.charcoal }}>
                    {testimonial.attribution}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: palette.burgundy }}>
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
