import { motion } from "framer-motion";
import profilePic from "../assets/lightX.PNG";

export default function About({ palette }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: palette.charcoal }}
          >
            Meet the Interpreter Behind Miqueas Language Solutions
          </h1>

          <p className="mt-4 text-base md:text-lg text-gray-600">
            Clear communication. Thoughtful preparation. A process designed to
            make things simple for you.
          </p>
        </div>

        {/* Profile */}
        <div className="mt-10 flex flex-col items-center">
          <img
            src={profilePic}
            alt="Micah"
            className="w-40 h-40 rounded-full object-cover shadow-md"
          />
        </div>

        {/* Content */}
        <div className="mt-12 space-y-10 text-gray-700 leading-relaxed text-[15px] md:text-base">

          {/* Early Immersion */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: palette.charcoal }}>
              Early Immersion
            </h2>
            <p>
              Hi, I’m Micah.
            </p>
            <p className="mt-3">
              I didn’t learn ASL from a textbook first—I learned it through people.
            </p>
            <p className="mt-3">
              Back in 2013, I was spending time in real conversations with Deaf
              and Hard-of-Hearing individuals, learning how communication actually
              works in everyday life. That experience shaped everything for me.
            </p>
          </section>

          {/* Professional Journey */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: palette.charcoal }}>
              Professional Journey
            </h2>
            <p>
              When I started interpreting professionally in 2019, things shifted.
            </p>
            <p className="mt-3">
              Now it wasn’t just about knowing the language—it was about
              responsibility. People were depending on me in real moments where
              communication couldn’t afford to break down.
            </p>
            <p className="mt-3">
              I’ve worked across medical, educational, community, and cruise
              settings, and each environment reinforced how important clear
              communication really is.
            </p>
          </section>

          {/* Philosophy */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: palette.charcoal }}>
              Philosophy
            </h2>
            <p className="font-medium">
              Bridging Perspectives. Delivering Understanding.
            </p>
            <p className="mt-3">
              Every assignment is different—and I treat it that way.
            </p>
            <p className="mt-3">
              Before anything is confirmed, I take time to understand the people
              involved, the setting, and what will make communication flow
              naturally.
            </p>
          </section>

          {/* Experience */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: palette.charcoal }}>
              Experience Across Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border rounded-lg p-4">Medical</div>
              <div className="border rounded-lg p-4">Educational</div>
              <div className="border rounded-lg p-4">Community</div>
              <div className="border rounded-lg p-4">Cruise / Travel</div>
            </div>
          </section>

          {/* What It's Like */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: palette.charcoal }}>
              What It’s Like to Work With Me
            </h2>

            <ul className="space-y-2 list-disc pl-5">
              <li>Clear, natural communication</li>
              <li>Reduced confusion and stress</li>
              <li>Thoughtful preparation for your specific situation</li>
              <li>Guidance so you don’t have to figure things out alone</li>
            </ul>
          </section>

          {/* Process */}
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: palette.charcoal }}>
              What Happens Next
            </h2>

            <ol className="space-y-2 list-decimal pl-5">
              <li>Submit your request</li>
              <li>I review your details and communication needs</li>
              <li>You receive a follow-up to confirm availability</li>
            </ol>

            <p className="mt-4 text-sm text-gray-500">
              Submitting a request does not lock you into anything.
            </p>
          </section>

          {/* CTA */}
          <div className="text-center mt-12">
            <button
              className="px-6 py-3 rounded-full text-white font-medium shadow-md hover:opacity-90 transition"
              style={{ backgroundColor: palette.gold }}
            >
              Request an Interpreter
            </button>

            <p className="mt-3 text-sm text-gray-500">
              Takes less than 5 minutes • No commitment required
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}