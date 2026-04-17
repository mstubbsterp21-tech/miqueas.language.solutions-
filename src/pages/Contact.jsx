import InterpreterRequestForm from '../components/InterpreterRequestForm';

export default function Contact({ palette }) {
  return (
    <div className="space-y-10">
      <InterpreterRequestForm palette={palette} />

      <section
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
          If you need clarification or want to talk through your request, feel free to reach out directly. We’re here to make the process clear, simple, and tailored to your needs.
        </p>

        <a
          href="mailto:mstubbsterp21@gmail.com"
          className="mt-4 inline-block font-semibold underline"
          style={{ color: palette.gold }}
        >
          mstubbsterp21@gmail.com
        </a>
      </section>
    </div>
  );
}
