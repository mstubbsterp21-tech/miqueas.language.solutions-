import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Languages,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import profilePic from "../assets/lightX.PNG";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const storyBlocks = [
  {
    eyebrow: "2013",
    title: "Early Immersion",
    body:
      "I didn’t learn ASL from a textbook first — I learned it through people. Real conversations with Deaf and Hard-of-Hearing individuals taught me that language is not just words or signs. It is connection, clarity, and making sure people actually understand each other.",
  },
  {
    eyebrow: "2019",
    title: "Professional Responsibility",
    body:
      "When I began interpreting professionally, the work became more than language fluency. People were depending on me in medical appointments, classrooms, meetings, and moments where communication could not afford to break down.",
  },
  {
    eyebrow: "Today",
    title: "Miqueas Language Solutions",
    body:
      "MLS exists to provide ASL/English interpreting and ASL video translation with professional standards, human care, and thoughtful preparation for each setting.",
  },
];

const settingCards = [
  { title: "Medical", copy: "Clear access during appointments, care conversations, and health-related interactions." },
  { title: "Educational", copy: "Support for learning environments where accuracy, pacing, and access matter." },
  { title: "Community", copy: "Everyday services, meetings, programs, and public-facing interactions." },
  { title: "Cruise / Travel", copy: "Flexible support for high-movement, travel-based, and guest-experience settings." },
];

const approachItems = [
  {
    icon: Compass,
    title: "Context first",
    copy: "I look at who is involved, what the setting requires, and what communication needs may show up before the assignment begins.",
  },
  {
    icon: Languages,
    title: "Meaning over mechanics",
    copy: "Good interpreting is not robotic. The goal is to preserve meaning, tone, intent, and the natural flow of the interaction.",
  },
  {
    icon: HeartHandshake,
    title: "People-centered access",
    copy: "The work is professional, but it is still human. Everyone should feel respected, informed, and able to participate.",
  },
  {
    icon: ShieldCheck,
    title: "Prepared and ethical",
    copy: "I take fit, confidentiality, boundaries, and professional readiness seriously before confirming work.",
  },
];

const nextSteps = [
  "Submit your request with the details you have.",
  "I review the setting, participants, and communication needs.",
  "You receive follow-up with availability and clear next steps.",
];

function BridgeConceptIllustration({ palette }) {
  return (
    <svg
      viewBox="0 0 1050 600"
      role="img"
      aria-label="Stylized bridge concept illustration"
      className="absolute inset-x-[-8%] bottom-[-18px] h-auto w-[116%] max-w-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="bridgeDeck" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={palette.burgundy} stopOpacity="0.78" />
          <stop offset="0.55" stopColor={palette.burgundy} />
          <stop offset="1" stopColor={palette.gold} stopOpacity="0.8" />
        </linearGradient>
        <filter id="softBridgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#000000" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter="url(#softBridgeShadow)">
        <path
          d="M0 548 C120 544 178 552 238 522 C304 488 354 428 418 402 C492 372 578 385 654 372 C785 350 888 307 1050 285 L1050 328 C898 355 805 395 671 421 C584 438 493 425 421 456 C352 486 312 543 235 570 C164 596 82 579 0 582 Z"
          fill="url(#bridgeDeck)"
          opacity="0.98"
        />

        <path
          d="M294 338 L338 338 L354 552 L279 552 Z"
          fill={palette.burgundy}
          opacity="0.94"
        />
        <path
          d="M668 0 L742 0 L780 548 L619 548 Z"
          fill={palette.burgundy}
          opacity="0.96"
        />
        <path d="M705 0 L705 548" stroke="#3b120c" strokeWidth="12" opacity="0.28" />
        <path d="M318 338 L318 552" stroke="#3b120c" strokeWidth="7" opacity="0.22" />

        <g stroke={palette.burgundy} strokeWidth="3.2" strokeLinecap="round" opacity="0.82">
          {[260, 300, 340, 380, 420, 460, 500, 540, 580, 620, 660].map((x) => (
            <line key={`left-${x}`} x1="319" y1="344" x2={x} y2="520" />
          ))}
          {[445, 485, 525, 565, 605, 645, 685, 725, 765, 805, 845, 885, 925, 965, 1005, 1045].map((x) => (
            <line key={`main-${x}`} x1="705" y1="6" x2={x} y2="302" />
          ))}
          {[420, 455, 490, 525, 560, 595, 630, 665].map((x) => (
            <line key={`back-${x}`} x1="705" y1="6" x2={x} y2="410" />
          ))}
        </g>

        <path
          d="M0 579 C80 565 125 586 192 570 C248 556 302 558 363 572 C457 594 561 558 652 574 C754 592 847 561 942 577 C996 586 1026 572 1050 568 L1050 600 L0 600 Z"
          fill={palette.burgundy}
          opacity="0.97"
        />

        <g fill={palette.burgundy} opacity="0.94">
          <rect x="388" y="424" width="7" height="142" rx="2" />
          <rect x="484" y="391" width="7" height="154" rx="2" />
          <rect x="544" y="396" width="7" height="154" rx="2" />
          <rect x="800" y="323" width="8" height="170" rx="2" />
          <rect x="896" y="303" width="8" height="174" rx="2" />
          <rect x="1004" y="281" width="8" height="173" rx="2" />
        </g>
      </g>
    </svg>
  );
}

export default function About({ palette }) {
  const cardStyle = {
    borderColor: palette.border,
    backgroundColor: palette.white,
  };

  const goldBackground = {
    backgroundColor: palette.gold,
    color: palette.white,
  };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(114,17,0,0.12), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)",
          }}
        />
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_390px]"
          >
            <div>
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur"
                style={{ borderColor: palette.border, color: palette.burgundy }}
              >
                <Sparkles size={15} style={{ color: palette.gold }} />
                Meet MLS
              </div>

              <h1
                className="max-w-4xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl"
                style={{ color: palette.charcoal }}
              >
                Interpreting that feels clear, prepared, and genuinely human.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                I’m Micah — the interpreter behind Miqueas Language Solutions. My work is built around one simple goal: helping people cross the communication gap with clarity, respect, and confidence.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  style={goldBackground}
                >
                  Request an Interpreter
                  <ArrowRight size={17} />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: palette.border, color: palette.charcoal }}
                >
                  Explore Services
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  "ASL/English Interpreting",
                  "ASL Video Translation",
                  "Medical • Education • Community",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border bg-white/80 px-4 py-4 text-sm font-semibold shadow-sm backdrop-blur"
                    style={{ borderColor: palette.border, color: palette.charcoal }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[390px]">
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full opacity-90" style={{ backgroundColor: palette.gold }} />
              <div className="absolute -bottom-6 -right-6 h-36 w-36 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />

              <div className="relative rounded-[2.2rem] border bg-white p-4 shadow-2xl" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#f7f3ef] p-6">
                  <img src={profilePic} alt="Micah" className="mx-auto w-full max-w-[260px] object-contain" />
                </div>

                <div className="mt-4 rounded-[1.5rem] border bg-white p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                    Philosophy
                  </p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>
                    Bridging Perspectives. Delivering Understanding.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="overflow-hidden rounded-[2rem] border shadow-sm"
              style={{ borderColor: palette.border, backgroundColor: "#202020" }}
            >
              <div className="p-7 pb-5 md:p-8 md:pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  The bridge concept
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">
                  Interpreting is not just transferring words. It is building access in real time.
                </h2>
                <p className="mt-5 text-base leading-8 text-white/75">
                  On one side is you. On the other side is the person you’re trying to communicate with. My role is to help both of you cross that space clearly, naturally, and without unnecessary confusion.
                </p>
              </div>

              <div className="relative mx-5 mb-5 h-[250px] overflow-hidden rounded-[1.6rem] border bg-[#f7f3ef] shadow-inner md:mx-7 md:mb-7 md:h-[310px]" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
                <div className="absolute -left-20 top-10 h-48 w-48 rounded-full blur-3xl" style={{ backgroundColor: "rgba(221,125,0,0.22)" }} />
                <div className="absolute -right-20 top-2 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "rgba(114,17,0,0.16)" }} />
                <div className="absolute left-5 top-5 z-10 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] shadow-sm backdrop-blur" style={{ color: palette.burgundy }}>
                  Access in motion
                </div>
                <BridgeConceptIllustration palette={palette} />
              </div>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {approachItems.map(({ icon: Icon, title, copy }, index) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={fadeUp}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  style={cardStyle}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
            className="mb-8 max-w-3xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
              My story
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
              From real-world immersion to professional interpreting.
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-5 top-0 hidden h-full w-px bg-black/10 md:block" />
            <div className="space-y-5">
              {storyBlocks.map((block, index) => (
                <motion.article
                  key={block.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.22 }}
                  variants={fadeUp}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="relative rounded-[1.75rem] border bg-white p-6 shadow-sm md:ml-14 md:p-7"
                  style={cardStyle}
                >
                  <div className="absolute -left-[4.35rem] top-7 hidden h-10 w-10 items-center justify-center rounded-full border-4 border-white text-sm font-black text-white shadow-md md:flex" style={{ backgroundColor: palette.gold }}>
                    {index + 1}
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.burgundy }}>
                        {block.eyebrow}
                      </p>
                      <h3 className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>
                        {block.title}
                      </h3>
                    </div>
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(114,17,0,0.08)", color: palette.burgundy }}>
                      <MapPinned size={20} />
                    </div>
                  </div>
                  <p className="mt-4 text-base leading-8 text-[#5f6368]">
                    {block.body}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              transition={{ duration: 0.45 }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                Experience across settings
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>
                Different environments require different decisions.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">
                Each assignment has its own pacing, participants, power dynamics, vocabulary, and access needs. That is why I treat every request as its own situation — not a copy-and-paste job.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {settingCards.map((setting, index) => (
                <motion.div
                  key={setting.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={fadeUp}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="rounded-[1.5rem] border bg-white p-5 shadow-sm"
                  style={cardStyle}
                >
                  <CheckCircle2 size={22} style={{ color: palette.gold }} />
                  <h3 className="mt-4 text-lg font-black" style={{ color: palette.charcoal }}>
                    {setting.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#666]">{setting.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
              What happens next
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
              No guesswork. No confusion. Just a clear start.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#5f6368]">
              Submitting a request does not lock you into anything. It simply starts the process so we can make sure the assignment is the right fit.
            </p>
          </motion.div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="rounded-[1.5rem] border bg-white p-6 text-center shadow-sm"
                style={cardStyle}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white" style={{ backgroundColor: palette.burgundy }}>
                  {index + 1}
                </div>
                <p className="text-base font-bold leading-7" style={{ color: palette.charcoal }}>{step}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-10 overflow-hidden rounded-[2rem] border shadow-lg"
            style={{ borderColor: palette.border }}
          >
            <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
              <div className="bg-[#202020] p-7 md:p-9">
                <p className="text-sm font-semibold leading-7 text-white/70">
                  “This work is guided by accuracy, professionalism, and respect — but more than anything, it is about making sure people can understand and be understood.”
                </p>
              </div>
              <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[320px] md:p-9">
                <p className="text-sm leading-6 text-[#5f6368]">
                  Ready to get the process started?
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  style={goldBackground}
                >
                  Request an Interpreter
                  <ArrowRight size={17} />
                </Link>
                <p className="text-xs font-medium text-[#777]">
                  Takes less than 5 minutes • No commitment required
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
