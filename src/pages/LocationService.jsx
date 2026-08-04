import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, MapPin, MonitorSmartphone, Stethoscope } from "lucide-react";

const locations = {
  orlando: {
    eyebrow: "Orlando ASL services",
    title: "Professional ASL interpreting in Orlando",
    intro: "MLS supports Orlando organizations that need prepared, professional ASL-English interpreters for planned appointments, meetings, conferences, and community events.",
    area: "Orlando and nearby Central Florida communities",
  },
  ocala: {
    eyebrow: "Ocala ASL services",
    title: "Professional ASL interpreting in Ocala",
    intro: "MLS provides preparation-focused ASL-English interpreting support for organizations serving Deaf and hard-of-hearing people in Ocala and Marion County.",
    area: "Ocala, Marion County, and surrounding communities",
  },
  "central-florida": {
    eyebrow: "Central Florida ASL services",
    title: "Professional ASL interpreting across Central Florida",
    intro: "MLS coordinates qualified ASL-English interpreting for organizations throughout Central Florida, with each request reviewed for setting, modality, credentials, and communication needs.",
    area: "Central Florida, including Orlando and Ocala-area requests",
  },
};

export function NationwideVri({ palette }) {
  return <Landing palette={palette} data={{
    eyebrow: "Nationwide remote access",
    title: "Video remote ASL interpreting nationwide",
    intro: "MLS provides professional remote ASL-English interpreting for virtual meetings, telehealth, training, appointments, and other settings where VRI is an appropriate communication fit.",
    area: "Remote service available throughout the United States",
    remote: true,
  }} />;
}

export default function LocationService({ palette }) {
  const { locationId } = useParams();
  const data = locations[locationId];
  if (!data) return <Navigate to="/services" replace />;
  return <Landing palette={palette} data={data} />;
}

function Landing({ palette, data }) {
  const services = [
    { Icon: Stethoscope, title: "Healthcare", text: "Appointments, consultations, procedures, discharge planning, and other patient communication needs." },
    { Icon: Building2, title: "Business & education", text: "Interviews, onboarding, training, meetings, classes, conferences, and professional events." },
    { Icon: data.remote ? MonitorSmartphone : CalendarCheck, title: data.remote ? "Remote appointments" : "Planned community access", text: data.remote ? "Secure virtual access when the technology, environment, and communication needs support VRI." : "Community programs, legal appointments, performances, and other scheduled public-facing services." },
  ];
  return (
    <div>
      <section className="px-5 py-16 md:px-8 md:py-24" style={{ background: "linear-gradient(135deg, #f7f3ef 0%, #ffffff 62%)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: palette.gold }}>{data.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>{data.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5b5b5b] md:text-xl">{data.intro}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold" style={{ borderColor: palette.border, color: palette.burgundy }}><MapPin size={17} />{data.area}</div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black text-white" style={{ backgroundColor: palette.burgundy }}>Request an interpreter <ArrowRight size={17} /></Link>
              <Link to="/services" className="inline-flex items-center rounded-full border bg-white px-6 py-3 text-sm font-black" style={{ borderColor: palette.border, color: palette.charcoal }}>Compare services</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>Communication access matched to the assignment</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#5b5b5b]">MLS reviews the setting, participants, modality, timing, preparation materials, and requested credentials before confirming coverage. Availability varies by assignment and advance notice.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {services.map(({ Icon, title, text }) => <article key={title} className="rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: palette.border }}><Icon size={23} style={{ color: palette.gold }} /><h2 className="mt-4 text-xl font-black" style={{ color: palette.charcoal }}>{title}</h2><p className="mt-3 text-sm leading-7 text-[#666]">{text}</p></article>)}
          </div>
          <div className="mt-10 rounded-3xl bg-[#202020] p-7 text-white md:p-10">
            <h2 className="text-2xl font-black md:text-3xl">Ready to discuss the communication need?</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">Share the date, time, location or platform, setting, and known communication needs. MLS will review the request and follow up about fit and availability.</p>
            <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black text-white" style={{ backgroundColor: palette.gold }}>Start a request <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
