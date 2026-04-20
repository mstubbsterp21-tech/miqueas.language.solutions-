import InterpreterRequestForm from '../components/InterpreterRequestForm';
import { motion } from 'framer-motion';

export default function Contact({ palette }) {
  return (
    <div className="space-y-10">
      <InterpreterRequestForm palette={palette} />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl rounded-2xl border p-6 text-center shadow-sm"
        style={{
          borderColor: palette.border,
          backgroundColor: palette.white,
        }}
      >
        <h3 className="text-xl font-semibold" style={{ color: palette.charcoal }}>
          Still have questions?
        </h3>

        <p className="mt-3 text-sm leading-6" style={{ color: palette.body }}>
          If you need clarification or want to talk through your request, we’re here to help make everything clear, simple, and aligned with your needs.
        </p>

        <a
          href="mailto:m.stubbs@miqueaslanguagesolutions.com"
          className="mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90"
          style={{
            backgroundColor: palette.gold,
            color: palette.white,
          }}
        >
          Contact Us
        </a>
      </motion.section>
    </div>
  );
}
