// eslint-disable-next-line no-unused-vars
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
            id="about-heading"
          >
            Meet the Interpreter Behind Miqueas Language Solutions
          </h1>

          <p
            className="mt-6 text-lg leading-8"
            style={{ color: palette.body }}
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
              style={{ color: palette.body }}
            >
              <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>Early Immersion</h2>
              <p>Hi, I’m Micah.</p>

              <p>
                My journey with American Sign Language began in 2013, and from the beginning, my
                experience was rooted in real-life interaction—not just a
                classroom. I developed my language skills by spending time
                directly with Deaf and Hard-of-Hearing individuals, learning
                through conversation, shared experiences, and consistent
                community involvement, including community and volunteer-based
                environments. That environment shaped how I understand language—not just as words or signs,
                 but as connection.
              </p>

              <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>Professional Journey</h2>
              <p>
                When I began interpreting professionally in 2019, everything shifted. What once felt like learning became responsibility.
                I stepped into situations where people were depending on me to ensure communication was accurate, respectful, and fully accessible. 
                Over time, I’ve worked in a variety of settings and seen how much is at stake when communication is done well—or poorly. From 
                medical appointments to educational settings to community events and cruise assignments, it's been a privilege to be a small part of 
                so many different interactions and to see how language access can make a real difference in people’s lives.
                Those experiences sharpened not just my skills, but my awareness of the role I carry every time I interpret. 
              </p>

              <h2 className="text-xl font-semibold" style={{ color: palette.charcoal }}>Philosophy</h2>
              <p className="font-semibold" style={{ color: palette.charcoal }}>
                Bridging Perspectives. Delivering Understanding
              </p>

              <p>
                Miqueas Language Solutions is built on that foundation of real-world experience and responsibility. 
                The work is guided by a commitment to accuracy, professionalism, and respect for every person involved. 
                That means prioritizing clear communication, maintaining strong ethical standards, and continuing to grow 
                in both skill and cultural awareness. When you work with me, you’re working with someone who understands 
                that this is more than a service—it’s access. And I approach that responsibility with care, consistency, 
                and intention in order to bridge perspectives and deliver understanding in every interaction.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
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
            Feedback from those who have experienced the professionalism, care,
            and community-centered approach behind the work.
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
              <p
                className="text-base leading-8 italic"
                style={{ color: palette.body }}
              >
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