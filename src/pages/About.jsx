import { motion } from 'framer-motion';
import profilePic from '../assets/lightX.PNG';

export default function About({ palette }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
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
          >
            Meet the Interpreter Behind Miqueas Language Solutions
          </h1>

          <p
            className="mt-6 text-lg leading-8"
            style={{ color: '#5f5f5f' }}
          >
            Learn more about the story, values, and real-world experience behind
            the work.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
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
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <div
              className="space-y-5 text-base leading-8 md:text-lg"
              style={{ color: '#5f5f5f' }}
            >
              <p>Hi, I’m Micah.</p>

              <p>
                I started learning ASL in 2013, and from the beginning, my
                experience was rooted in real-life interaction—not just a
                classroom. I developed my language skills by spending time
                directly with Deaf and Hard-of-Hearing individuals, learning
                through conversation, shared experiences, and consistent
                community involvement, including community and volunteer-based
                environments.
              </p>

              <p>
                That kind of immersive learning shaped how I understand
                communication. It taught me to focus on meaning, adapt to
                different signing styles, and stay present with the person in
                front of me.
              </p>

              <p>
                When I began interpreting professionally in 2019, everything
                shifted. I stepped into a role where people were depending on
                me to ensure communication was accurate, respectful, and
                accessible.
              </p>

              <p>
                Over time, I’ve worked in a variety of settings and seen how
                impactful clear communication can be—and how frustrating it is
                when access isn’t there. That perspective continues to shape
                how I approach this work today.
              </p>

              <p className="font-semibold" style={{ color: palette.charcoal }}>
                That’s the foundation Miqueas Language Solutions is built on.
              </p>

              <p>
                Today, that foundation shows up through dependable service,
                ongoing growth, and a commitment to providing professional
                language access with genuine care.
              </p>

              <p>
                If you’re working with me, you’re working with someone who
                values clear communication, respects the people involved, and
                understands the responsibility that comes with this role.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}