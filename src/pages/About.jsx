import { motion } from 'framer-motion';
import profilePic from '../assets/lightX.PNG';

export default function About({ palette }) {
  const testimonials = [
    {
      quote:
        'Micah is professional and competent. He works well as part of an interpreting team, is attentive in the support role, receptive to feedback, and communicates well when assessing how to better meet the needs of the consumer.',
      role: 'Interpreter Colleague',
    },
    {
      quote:
        'Micah is a highly intelligent, motivated, and skilled interpreter. He stays engaged with the Deaf community, actively seeks ways to continue learning and growing, and possesses a genuine love, passion, and respect for the language, community, and field.',
      role: 'Interpreter Mentor and Colleague',
    },
    {
      quote:
        'Micah is very involved in the interpreting field and the Deaf community he serves. He consistently makes every effort to adapt to the needs of Deaf consumers, anticipates needs well, follows through, and shows strong professionalism and attention to detail.',
      role: 'Deaf Consumer',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">

      {/* HEADER */}
      <motion.section
        initial={false} // 🔥 FIX: prevents blank screen on mobile
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: palette.gold }}
          >
            About
          </p>

          <h1
            className="mt-3 text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: palette.charcoal }}
            id="about-heading"
          >
            Meet the Interpreter Behind Miqueas Language Solutions
          </h1>

          <p
            className="mt-6 text-lg leading-8"
            style={{ color: palette.body }}
          >
            Learn more about the story, values, and real-world experience behind the work.
          </p>
        </div>
      </motion.section>

      {/* MAIN CONTENT */}
      <motion.section
        initial={false} // 🔥 FIX
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="mt-14"
      >
        <div
          className="grid items-center gap-10 rounded-[2rem] border p-6 md:p-10 lg:grid-cols-[340px_minmax(0,1fr)]"
          style={{
            backgroundColor: palette.white,
            borderColor: palette.border,
          }}
        >

          {/* IMAGE */}
          <div className="mx-auto w-full max-w-[320px]">
            <div
              className="overflow-hidden rounded-[2rem] border shadow-sm"
              style={{
                borderColor: palette.border,
                backgroundColor: '#eeeeee',
              }}
            >
              <img
                src={profilePic}
                alt="Micah, founder of Miqueas Language Solutions"
                className="w-full h-auto object-cover" // 🔥 FIX: prevents stretching on mobile
              />
            </div>
          </div>

          {/* TEXT */}
          <div>
            <div
              className="space-y-5 text-base leading-8 md:text-lg"
              style={{ color: palette.body }}
            >
              <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>
                Early Immersion
              </h2>

              <p>Hi, I’m Micah.</p>

              <p>
                My journey with American Sign Language began in 2013, rooted in real-life interaction—not just a classroom.
                That environment shaped how I understand language—not just as words or signs, but as connection.
              </p>

              <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>
                Professional Journey
              </h2>

              <p>
                Since 2019, I’ve worked in medical, educational, community, and cruise settings.
                These experiences sharpened not just my skills, but my awareness of the responsibility I carry every time I interpret.
              </p>

              <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>
                Philosophy
              </h2>

              <p className="font-semibold" style={{ color: palette.charcoal }}>
                Bridging Perspectives. Delivering Understanding
              </p>

              <p>
                This work is guided by accuracy, professionalism, and respect.
                It’s more than a service—it’s access.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* TESTIMONIALS */}
      <motion.section
        initial={false} // 🔥 FIX
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="mt-20"
      >
        <div className="max-w-3xl">
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: palette.gold }}
          >
            Testimonials
          </p>

          <h2
            className="mt-3 text-3xl font-bold tracking-tight md:text-4xl"
            style={{ color: palette.charcoal }}
          >
            What people are saying
          </h2>

          <p
            className="mt-4 text-lg leading-8"
            style={{ color: palette.body }}
          >
            Feedback from real experiences.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-[2rem] border p-6 shadow-sm"
              style={{
                backgroundColor: palette.white,
                borderColor: palette.border,
              }}
            >
              <p className="text-base leading-8 italic" style={{ color: palette.body }}>
                “{testimonial.quote}”
              </p>

              <div className="mt-6">
                <p
                  className="text-sm font-semibold uppercase tracking-[0.12em]"
                  style={{ color: palette.gold }}
                >
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}