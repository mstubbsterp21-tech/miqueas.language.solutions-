import { ShieldCheck, HeartHandshake, Clock3, Stethoscope, GraduationCap, Ship, Users } from "lucide-react";

export default function About({ palette }) {
  const values = [
    {
      title: "Professional standards",
      text: "Assignments are approached with professionalism, preparation, and respect for client needs.",
      icon: ShieldCheck,
    },
    {
      title: "Personalized service",
      text: "You are not treated like a number. Each inquiry is handled with care, communication, and attention to detail.",
      icon: HeartHandshake,
    },
    {
      title: "Clear coordination",
      text: "From intake to assignment planning, the goal is to make the process feel simple, responsive, and dependable.",
      icon: Clock3,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-20">
      <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>
        A company rooted in skill, growth, and real community connection
      </h2>
      <p className="mb-10 max-w-3xl text-base md:text-lg" style={{ color: "#5f5f5f" }}>
        Miqueas Language Solutions was built to offer clients the kind of professional support that still feels human. The goal is simple: provide language access with care, clarity, and strong attention to the people involved.
      </p>

      {/* Story section */}
      <div className="mb-10 rounded-[2rem] border p-7 shadow-sm"
           style={{ backgroundColor: palette.white, borderColor: palette.border }}>
        <h3 className="text-2xl font-bold" style={{ color: palette.charcoal }}>Our story</h3>
        <div className="mt-5 space-y-4 text-sm leading-7 md:text-base" style={{ color: "#5f5f5f" }}>
          <p>
            The work behind Miqueas Language Solutions grew out of years of language development, community connection, and professional interpreting experience. After beginning ASL study in 2013 and entering the field professionally in 2019, the mission became clearer with time: help reduce communication barriers and support more equitable access between Deaf and hearing worlds.
          </p>
          <p>
            Today, that mission shows up through dependable service, ongoing growth, and a commitment to meeting clients and consumers with respect. The result is a business that values both professional standards and genuine care.
          </p>
        </div>
      </div>

      {/* Credentials */}
      <div className="mb-10 rounded-[2rem] border p-7 shadow-sm"
           style={{ backgroundColor: palette.white, borderColor: palette.border }}>
        <h3 className="text-2xl font-bold" style={{ color: palette.charcoal }}>Credentials & experience</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ["EIPA", "Educational Interpreter Performance Assessment"],
            ["Pre‑Certified (NIC)", "Written exam passed; performance exam in progress"],
            ["7 Years", "Professional interpreting experience"],
            ["Remote + On-Site", "Experience across VRI and in-person settings"],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <div className="font-semibold" style={{ color: palette.burgundy }}>
                {title}
              </div>
              <div className="mt-2 text-sm leading-6" style={{ color: "#5f5f5f" }}>
                {body}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="mb-10 rounded-[2rem] border p-7 shadow-sm"
           style={{ backgroundColor: palette.white, borderColor: palette.border }}>
        <h3 className="text-2xl font-bold" style={{ color: palette.charcoal }}>
          Why this company stands out
        </h3>
        <div className="mt-5 grid gap-4">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl p-4"
                   style={{ backgroundColor: palette.softGray }}>
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl"
                     style={{ backgroundColor: palette.gold, color: "#ffffff" }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-semibold" style={{ color: palette.charcoal }}>{item.title}</h4>
                  <p className="mt-1 text-sm leading-6" style={{ color: "#5f5f5f" }}>
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Professional reputation */}
      <div className="rounded-[2rem] border p-7 shadow-sm"
           style={{ backgroundColor: palette.softGray, borderColor: palette.border }}>
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>
          Professional reputation
        </p>
        <h3 className="mt-3 text-2xl font-bold" style={{ color: palette.charcoal }}>
          Trusted by mentors and colleagues
        </h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            "Professional and competent, with strong teamwork and receptiveness to feedback.",
            "Highly intelligent, motivated, and skilled, while remaining respectful of professional boundaries.",
          ].map((quote) => (
            <div key={quote} className="rounded-2xl border bg-white p-5 shadow-sm"
                 style={{ borderColor: palette.border }}>
              <p className="text-sm leading-7" style={{ color: "#5f5f5f" }}>“{quote}”</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}