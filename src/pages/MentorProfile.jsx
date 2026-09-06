import { ArrowRight, CheckCircle2, HeartHandshake, Languages, MessageCircle, Monitor, Users } from "lucide-react";

const mentoringAreas = [
  "ASL ↔ English interpreting skill development",
  "Educational interpreting and EIPA-focused growth",
  "Voicing, message accuracy, and processing",
  "Ethical decision-making and reflective practice",
  "VRI / VRS readiness and professional judgment",
  "Goal-setting, self-analysis, and deliberate practice",
];

const expectations = [
  "Come ready to reflect, practice, and ask questions.",
  "Bring real goals, samples, feedback, or situations you want to unpack.",
  "Be open to specific feedback without expecting perfection.",
  "Take ownership of practice between sessions so our time together can stay focused.",
];

const fitQuestions = [
  "What are you hoping to improve right now?",
  "What kind of interpreting work are you currently doing or preparing for?",
  "What feedback have you received that you want help understanding or applying?",
  "What would make mentorship feel useful and supportive to you?",
];

export default function MentorProfile({ palette }) {
  const cardStyle = {
    borderColor: palette.border,
    backgroundColor: palette.white,
  };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 12% 10%, rgba(221,125,0,0.18), transparent 30%), radial-gradient(circle at 88% 12%, rgba(114,17,0,0.14), transparent 34%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)",
          }}
        />
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur"
                style={{ borderColor: palette.border, color: palette.burgundy }}
              >
                <HeartHandshake size={15} style={{ color: palette.gold }} />
                Mentorship with Micah Stubbs
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Growth-focused mentorship for interpreters who want more than a score.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                I approach mentorship as a collaborative space to slow the work down, look closely at what is happening, and turn feedback into practical next steps. The goal is not to make you interpret like me. It is to help you become a more intentional, confident, and effective version of yourself as an interpreter.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:m.stubbs@miqueaslanguagesolutions.com?subject=Mentorship%20Inquiry"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor: palette.gold }}
                >
                  Start a Conversation
                  <ArrowRight size={17} />
                </a>
                <a
                  href="tel:+13213798010"
                  className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: palette.border, color: palette.charcoal }}
                >
                  (321) 379-8010
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[460px]">
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full opacity-90" style={{ backgroundColor: palette.gold }} />
              <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="relative rounded-[2.2rem] border bg-white p-6 shadow-2xl" style={{ borderColor: palette.border }}>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
                  My approach
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight" style={{ color: palette.charcoal }}>
                  Reflect. Practice. Apply.
                </h2>
                <p className="mt-4 leading-8 text-[#5f6368]">
                  Strong mentorship should help you understand why something is working, why something is breaking down, and what you can actually do differently next time.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {["Collaborative", "Practical", "Reflective"].map((item) => (
                    <div key={item} className="rounded-2xl border bg-[#f7f3ef] px-3 py-4 text-center text-xs font-black uppercase tracking-[0.12em]" style={{ borderColor: palette.border, color: palette.burgundy }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border bg-white p-7 shadow-sm md:p-8" style={cardStyle}>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>About me</p>
            <h2 className="mt-3 text-3xl font-black" style={{ color: palette.charcoal }}>Interpreter first. Mentor alongside you.</h2>
            <p className="mt-5 leading-8 text-[#5f6368]">
              I began learning ASL through real relationships with Deaf and Hard-of-Hearing people before entering the profession. I started interpreting professionally in 2019 and have worked across educational, medical, community, remote, and other real-world settings where language decisions have consequences.
            </p>
            <p className="mt-4 leading-8 text-[#5f6368]">
              My professional development includes the Educational Interpreter Performance Assessment (EIPA) and successfully completing both portions of the CASLI Generalist Knowledge Exam. I am still actively developing my own work, which shapes how I mentor: I do not believe growth ends when someone earns a credential.
            </p>
          </article>

          <article className="rounded-[2rem] p-7 text-white shadow-xl md:p-8" style={{ background: `linear-gradient(135deg, ${palette.charcoal}, ${palette.burgundy})` }}>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Why mentorship</p>
            <h2 className="mt-3 text-3xl font-black">A place to think, not perform.</h2>
            <p className="mt-5 leading-8 text-white/80">
              Interpreters are often given feedback like “be more accurate,” “improve your voicing,” or “work on fluency” without enough support for figuring out what those comments actually mean in practice. Mentorship gives us room to break those broad ideas into observable skills, test strategies, reflect on outcomes, and build a plan that belongs to you.
            </p>
          </article>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>What we can work on</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>
                Your goals drive the work.
              </h2>
              <p className="mt-4 leading-8 text-[#5f6368]">
                We can focus on one specific skill, build toward an assessment, unpack feedback from your work, or look at the bigger patterns affecting your interpreting.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {mentoringAreas.map((area) => (
                <div key={area} className="rounded-[1.4rem] border bg-white p-5 shadow-sm" style={cardStyle}>
                  <CheckCircle2 size={21} style={{ color: palette.gold }} />
                  <p className="mt-3 font-bold leading-7" style={{ color: palette.charcoal }}>{area}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Logistics</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl" style={{ color: palette.charcoal }}>What mentorship can look like</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: Monitor, title: "Virtual-first", text: "Mentorship is primarily available virtually, making it easier to work together across locations." },
              { icon: Users, title: "One-on-one", text: "My primary format is individual mentorship so the work can stay centered on your goals, patterns, and feedback." },
              { icon: MessageCircle, title: "Flexible structure", text: "Sessions can be used as focused stand-alone meetings or as part of an ongoing mentorship plan based on what you need." },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[1.6rem] border bg-white p-6 text-center shadow-sm" style={cardStyle}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                  <Icon size={23} />
                </div>
                <h3 className="mt-4 text-xl font-black" style={{ color: palette.charcoal }}>{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border bg-white p-7 shadow-sm md:p-8" style={cardStyle}>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>What I ask from you</p>
            <h2 className="mt-3 text-3xl font-black" style={{ color: palette.charcoal }}>Curiosity matters more than perfection.</h2>
            <div className="mt-6 space-y-4">
              {expectations.map((item) => (
                <div key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-1 shrink-0" size={19} style={{ color: palette.gold }} />
                  <p className="leading-7 text-[#5f6368]">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border bg-white p-7 shadow-sm md:p-8" style={cardStyle}>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Before we start</p>
            <h2 className="mt-3 text-3xl font-black" style={{ color: palette.charcoal }}>Fit matters.</h2>
            <p className="mt-4 leading-8 text-[#5f6368]">
              The first conversation is about understanding what you need and whether I am the right person to support it. I would rather be clear about fit than fill a mentorship slot that does not serve you.
            </p>
            <div className="mt-5 space-y-3">
              {fitQuestions.map((question) => (
                <div key={question} className="rounded-2xl bg-[#f7f3ef] px-4 py-3 text-sm font-semibold leading-6" style={{ color: palette.charcoal }}>
                  {question}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.2rem] border shadow-xl" style={{ borderColor: palette.border }}>
          <div className="grid lg:grid-cols-[1fr_auto]">
            <div className="bg-[#202020] p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Let’s connect</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Tell me where you are and where you want to go.</h2>
              <p className="mt-4 max-w-2xl leading-8 text-white/75">
                Send a brief message with your current interpreting context, the area you want to strengthen, and what you hope mentorship will help you accomplish. From there, we can decide together what the next step should be.
              </p>
            </div>
            <div className="flex min-w-[320px] flex-col justify-center gap-4 bg-white p-8 md:p-10">
              <a href="mailto:m.stubbs@miqueaslanguagesolutions.com?subject=Mentorship%20Inquiry" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
                Email Micah
                <ArrowRight size={17} />
              </a>
              <p className="text-center text-sm font-semibold" style={{ color: palette.burgundy }}>m.stubbs@miqueaslanguagesolutions.com</p>
              <p className="text-center text-xs text-[#777]">Miqueas Language Solutions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
