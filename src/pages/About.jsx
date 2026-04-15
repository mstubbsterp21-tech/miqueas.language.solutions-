import { motion } from "framer-motion";
import profilePic from "../assets/lightX.PNG";

export default function About({ palette }) {
  const cardStyle = {
    borderColor: palette.border,
    backgroundColor: palette.white,
  };

  const sectionTitleStyle = {
    color: palette.charcoal,
  };

  const accentStyle = {
    color: palette.gold,
  };

  const buttonStyle = {
    backgroundColor: palette.gold,
    color: palette.white,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="rounded-[2rem] border p-6 shadow-sm md:p-10"
        style={{ borderColor: palette.border, backgroundColor: "#fafafa" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="flex flex-col items-center lg:sticky lg:top-24">
              <div
                className="w-full max-w-[320px] rounded-[2rem] border p-6 shadow-sm"
                style={cardStyle}
              >
                <img
                  src={profilePic}
                  alt="Portrait of Micah Stubbs, ASL interpreter"
                  className="mx-auto w-full max-w-[220px] object-contain"
                />
              </div>
            </div>

            <div>
              <div className="max-w-3xl">
                <h1
                  className="text-3xl font-bold tracking-tight md:text-5xl"
                  style={{ color: palette.charcoal }}
                >
                  Meet the Interpreter Behind
                  <br className="hidden sm:block" /> Miqueas Language Solutions
                </h1>

                <p
                  className="mt-4 max-w-2xl text-base leading-7 md:text-lg"
                  style={{ color: palette.charcoal }}
                >
                  Professional interpreting that keeps communication clear and
                  stress-free.
                </p>

                <p
                  className="mt-3 max-w-2xl text-sm leading-6 md:text-base"
                  style={{ color: palette.charcoal }}
                >
                  Trusted in medical, educational, community, and travel-based
                  environments where clear communication matters most.
                </p>
              </div>

              <div className="mt-10 space-y-10 md:space-y-12">
                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    Early Immersion
                  </h2>

                  <div
                    className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                    style={{ color: palette.charcoal }}
                  >
                    <p>Hi, I’m Micah.</p>

                    <p>
                      I didn’t learn ASL from a textbook first—I learned it
                      through people.
                    </p>

                    <p>
                      Back in 2013, I was spending time in real conversations
                      with Deaf and Hard-of-Hearing individuals, learning how
                      communication actually works in everyday life. That
                      experience shaped everything for me. It taught me that
                      language isn’t just about words or signs—it’s about
                      connection, clarity, and making sure people truly
                      understand each other.
                    </p>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.03 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    Professional Journey
                  </h2>

                  <div
                    className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                    style={{ color: palette.charcoal }}
                  >
                    <p>
                      When I started interpreting professionally in 2019, things
                      shifted.
                    </p>

                    <p>
                      Now it wasn’t just about knowing the language—it was about
                      responsibility. People were depending on me in real
                      moments—medical appointments, classrooms, meetings, and
                      situations where communication couldn’t afford to break
                      down.
                    </p>

                    <p>
                      Over time, I’ve worked across medical, educational,
                      community, and cruise settings. Each environment sharpened
                      not just my skills, but my awareness of what’s at stake
                      every time I interpret.
                    </p>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    Philosophy
                  </h2>

                  <div
                    className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                    style={{ color: palette.charcoal }}
                  >
                    <p className="font-semibold" style={accentStyle}>
                      Bridging Perspectives. Delivering Understanding.
                    </p>

                    <p>
                      I think of interpreting like a bridge. On one side is you.
                      On the other side is the person you’re trying to
                      communicate with.
                    </p>

                    <p>
                      My role is to help both of you cross that space clearly,
                      naturally, and without unnecessary confusion.
                    </p>

                    <p>
                      Every assignment is different—and I treat it that way.
                    </p>

                    <p>
                      Before anything is confirmed, I take time to understand:
                    </p>

                    <ul className="space-y-2 pl-6 text-[15px] leading-8 md:text-lg list-disc">
                      <li>who is involved</li>
                      <li>what the setting requires</li>
                      <li>what will make communication flow naturally</li>
                    </ul>

                    <p>
                      Because good interpreting isn’t just accurate—it feels
                      seamless to everyone involved.
                    </p>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.07 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    Experience Across Settings
                  </h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {["Medical", "Educational", "Community", "Cruise / Travel"].map(
                      (item) => (
                        <div
                          key={item}
                          className="rounded-xl border bg-white px-4 py-4 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:text-base"
                          style={cardStyle}
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.09 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    What It’s Like to Work With Me
                  </h2>

                  <div
                    className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                    style={{ color: palette.charcoal }}
                  >
                    <p>
                      If you’re here, you’re probably trying to make sure
                      everything goes smoothly—and that’s exactly where I come
                      in.
                    </p>

                    <p>My role is to:</p>

                    <ul className="space-y-2 pl-6 text-[15px] leading-8 md:text-lg list-disc">
                      <li>reduce confusion</li>
                      <li>remove communication barriers</li>
                      <li>help everyone stay focused on what actually matters</li>
                    </ul>

                    <p>
                      You don’t have to figure everything out on your own. I’ll
                      walk through the details with you and make sure the
                      assignment is set up properly from the start.
                    </p>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.11 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    What Happens Next
                  </h2>

                  <div
                    className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                    style={{ color: palette.charcoal }}
                  >
                    <p>Once you submit a request:</p>

                    <ol className="space-y-2 pl-6 list-decimal">
                      <li>I review your details personally</li>
                      <li>I assess the communication needs and setting</li>
                      <li>I follow up with you to confirm availability and next steps</li>
                    </ol>

                    <p className="font-medium">
                      No guesswork. No confusion. Just clear communication from
                      the beginning.
                    </p>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.13 }}
                >
                  <div
                    className="rounded-2xl border p-6 shadow-sm"
                    style={{
                      borderColor: palette.border,
                      backgroundColor: palette.white,
                    }}
                  >
                    <h2
                      className="text-2xl font-semibold"
                      style={sectionTitleStyle}
                    >
                      Reassurance
                    </h2>

                    <div
                      className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                      style={{ color: palette.charcoal }}
                    >
                      <p>
                        Submitting a request does not lock you into anything.
                      </p>

                      <p>
                        It simply starts the process so we can make sure
                        everything is the right fit.
                      </p>

                      <p style={{ color: palette.charcoal }}>
                        If you’re unsure about any details, that’s completely
                        okay—just submit what you have, and I’ll help guide the
                        rest.
                      </p>
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                >
                  <h2
                    className="text-2xl font-semibold"
                    style={sectionTitleStyle}
                  >
                    In Closing...
                  </h2>

                  <div
                    className="mt-4 space-y-4 text-[15px] leading-8 md:text-lg"
                    style={{ color: palette.charcoal }}
                  >
                    <p>
                      This work is guided by accuracy, professionalism, and
                      respect.
                    </p>

                    <p className="font-semibold">
                      But more than anything—it’s about you, your client, and
                      making sure both of you can cross that bridge into mutual
                      understanding.
                    </p>
                  </div>
                </motion.section>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.17 }}
                  className="pt-2 text-center"
                >
                  <p
                    className="mx-auto mb-4 max-w-2xl text-sm leading-6 md:text-base"
                    style={{ color: palette.charcoal }}
                  >
                    Ready to get the process started?
                  </p>

                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:opacity-90 md:text-base"
                    style={buttonStyle}
                  >
                    Request an Interpreter
                  </a>

                  <p
                    className="mt-3 text-xs font-medium md:text-sm"
                    style={{ color: palette.charcoal }}
                  >
                    Takes less than 5 minutes • No commitment required
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}