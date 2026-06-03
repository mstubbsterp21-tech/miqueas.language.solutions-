import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  FileVideo,
  Globe,
  MonitorSmartphone,
  Quote,
  Send,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatBlogDate, getPublishedBlogPosts } from "../content/blogPosts";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const serviceCards = [
  { icon: Users, title: "In-Person Interpreting", path: "/services/in-person-interpreting", copy: "On-site access for appointments, meetings, events, and live settings." },
  { icon: Video, title: "Video Remote Interpreting", path: "/services/video-remote-interpreting", copy: "Real-time ASL access for virtual meetings, telehealth, and remote support." },
  { icon: FileVideo, title: "English → ASL Translation", path: "/services/english-asl-translation", copy: "Recorded ASL video translation for public-facing or internal information." },
  { icon: Globe, title: "ASL → English Translation", path: "/services/asl-english-translation", copy: "Transcripts, captions, summaries, and English-ready documentation." },
];

export default function Home({ palette }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const publishedBlogPosts = getPublishedBlogPosts();
  const featuredArticle = publishedBlogPosts.find((post) => post.featured) || publishedBlogPosts[0];

  const stats = [
    ["7+ Years", "Professional interpreting experience across diverse real-world settings"],
    ["EIPA 3.9", "Educational interpreting background with ongoing professional development"],
    ["Florida + Remote", "In-person and remote service options for organizations and communities"],
  ];

  const sectors = [
    { icon: Stethoscope, label: "Medical", description: "Appointments, consultations, and healthcare interactions where clarity matters." },
    { icon: Building2, label: "Educational", description: "School meetings, classroom settings, trainings, and access planning." },
    { icon: BriefcaseBusiness, label: "Business", description: "Workplace meetings, interviews, trainings, and organizational communication." },
    { icon: Users, label: "Community", description: "Public services, events, social services, and everyday community access." },
  ];

  const testimonials = [
    {
      quote:
        "Micah is very involved in the interpreting field and Deaf community. He consistently makes every effort to adapt to the needs of his Deaf consumers, appropriately anticipates my needs, and follows through.",
      role: "Deaf Consumer",
    },
    {
      quote:
        "Micah is a highly intelligent, motivated, and skilled interpreter. He is respectful, professional, and actively seeks ways to continue learning and growing. You will have no regrets in hiring Micah Stubbs.",
      role: "Interpreter Mentor",
    },
    {
      quote:
        "Micah is professional and competent. He works well as part of an interpreting team, communicates well about consumer needs, and demonstrates humility by continuing to learn without going beyond the scope of his skills and experience.",
      role: "Interpreter Colleague",
    },
  ];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonials.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  const goToPreviousTestimonial = () => {
    setActiveTestimonial((current) => (current === 0 ? testimonials.length - 1 : current - 1));
  };

  const goToNextTestimonial = () => {
    setActiveTestimonial((current) => (current + 1) % testimonials.length);
  };

  const goldButton = { backgroundColor: palette.gold, color: palette.white };
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 92% 8%, rgba(114,17,0,0.14), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
                <BadgeCheck size={15} style={{ color: palette.gold }} />
                Professional ASL-English Interpreting
              </div>
              <h1 className="text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Professional ASL-English interpreting for organizations that can’t afford miscommunication.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
                Miqueas Language Solutions provides interpreting and ASL video translation services with a focus on clarity, preparation, access, and genuine human connection.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                  Request an Interpreter
                  <ArrowRight size={17} />
                </Link>
                <Link to="/join-our-team" className="inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                  Join Our Team
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map(([stat, label]) => (
                  <div key={stat} className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur" style={{ borderColor: palette.border }}>
                    <div className="text-lg font-black" style={{ color: palette.burgundy }}>{stat}</div>
                    <p className="mt-2 text-xs leading-5 text-[#666]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[430px] lg:mx-0">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20" style={{ backgroundColor: palette.burgundy }} />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-80" style={{ backgroundColor: palette.gold }} />
              <div className="relative rounded-[2.2rem] border bg-white p-4 shadow-2xl md:p-5" style={{ borderColor: palette.border }}>
                <div className="rounded-[1.8rem] bg-[#202020] p-6 text-white md:p-7">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">MLS approach</p>
                      <h2 className="mt-3 text-2xl font-black leading-tight">Clear communication. Professional presence. Reliable access.</h2>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: palette.gold }}>
                      <MonitorSmartphone size={22} color="#ffffff" />
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {sectors.map(({ icon: Icon, label, description }) => (
                      <div key={label} className="min-h-[145px] rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <Icon size={20} style={{ color: palette.gold }} />
                        <h3 className="mt-3 text-sm font-black text-white">{label}</h3>
                        <p className="mt-2 text-xs leading-5 text-white/65">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-[1.5rem] border bg-[#f7f3ef] p-5" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Why MLS</p>
                  <p className="mt-2 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>A personable experience that helps clients feel supported, not processed.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Services</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Choose the service path that fits the communication need.</h2>
          </motion.div>
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map(({ icon: Icon, title, path, copy }, index) => (
              <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="group h-full rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}><Icon size={22} /></div>
                <h3 className="text-lg font-black" style={{ color: palette.charcoal }}>{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666]">{copy}</p>
                <Link to={path} className="mt-6 inline-flex items-center gap-2 text-sm font-bold transition group-hover:gap-3" style={{ color: palette.gold }}>
                  Explore service
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {featuredArticle && (
        <section className="px-5 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <motion.article initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[2.2rem] border bg-white shadow-xl" style={{ borderColor: palette.border }}>
              <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex min-h-[300px] flex-col justify-between bg-[#202020] p-7 text-white md:p-9">
                  <div>
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: palette.gold }}>
                      <FileText size={22} color="#ffffff" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.gold }}>Featured Article</p>
                    <h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl">Helpful insight before you book.</h2>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-2"><CalendarDays size={16} style={{ color: palette.gold }} />{formatBlogDate(featuredArticle.publishDate)}</span>
                    <span className="inline-flex items-center gap-2"><Clock size={16} style={{ color: palette.gold }} />{featuredArticle.readTime}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-7 md:p-9">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{featuredArticle.category}</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>{featuredArticle.title}</h2>
                  <p className="mt-4 text-lg leading-8 text-[#555]">{featuredArticle.excerpt}</p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to={`/blog/${featuredArticle.slug}`} className="inline-flex w-fit items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: palette.burgundy }}>
                      Read Featured Article
                      <ArrowRight size={17} />
                    </Link>
                    <Link to="/blog" className="inline-flex w-fit items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
                      View All Articles
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </section>
      )}

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl rounded-[2.2rem] border bg-[#fafafa] p-6 md:p-8" style={{ borderColor: palette.border }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>How it works</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>A clear process from request to confirmation.</h2>
              <p className="mt-4 text-base leading-8 text-[#5f6368]">MLS reviews service type, setting, logistics, preparation needs, and fit before confirming next steps.</p>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Send, title: "Request", copy: "Submit the details you have through the contact form." },
                { icon: ClipboardList, title: "Review", copy: "MLS reviews setting, service fit, logistics, and preparation needs." },
                { icon: CalendarCheck2, title: "Confirm", copy: "You receive follow-up with availability, quote details, and next steps." },
              ].map(({ icon: Icon, title, copy }, index) => (
                <motion.div key={title} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="rounded-[1.5rem] border bg-white p-6 text-center shadow-sm" style={cardStyle}>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: index === 1 ? palette.burgundy : palette.gold }}><Icon size={22} /></div>
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
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45 }} className="rounded-[2rem] border bg-[#202020] p-7 md:p-8" style={{ borderColor: palette.border }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Trust & experience</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">Professional service with community-rooted perspective.</h2>
              <p className="mt-5 text-base leading-8 text-white/75">MLS combines professional standards with real-world community experience, helping clients receive support that feels thoughtful, ethical, and human.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {["RID credential badge", "FRID affiliation", "Client-focused process", "Ethical practice"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-white/85">
                    <CheckCircle2 size={18} style={{ color: palette.gold, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: 0.05 }} className="rounded-[2rem] border bg-white p-6 shadow-sm md:p-8" style={cardStyle}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>References</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight" style={{ color: palette.charcoal }}>What others are saying.</h2>
                </div>
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl md:flex" style={{ backgroundColor: "rgba(221,125,0,0.12)", color: palette.gold }}>
                  <Quote size={22} />
                </div>
              </div>

              <div className="min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
                    <p className="text-base leading-8" style={{ color: palette.body }}>“{testimonials[activeTestimonial].quote}”</p>
                    <div className="mt-8 border-t pt-4" style={{ borderColor: palette.border }}>
                      <div className="text-sm font-black uppercase tracking-[0.14em]" style={{ color: palette.burgundy }}>{testimonials[activeTestimonial].role}</div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {testimonials.map((testimonial, index) => (
                    <button key={`${testimonial.role}-${index}`} type="button" aria-label={`Show testimonial ${index + 1}`} onClick={() => setActiveTestimonial(index)} className="h-2.5 rounded-full transition-all duration-200" style={{ width: index === activeTestimonial ? "2rem" : "0.625rem", backgroundColor: index === activeTestimonial ? palette.gold : `${palette.gold}40` }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={goToPreviousTestimonial} aria-label="Previous testimonial" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}><ChevronLeft size={18} /></button>
                  <button type="button" onClick={goToNextTestimonial} aria-label="Next testimonial" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}><ChevronRight size={18} /></button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border shadow-lg" style={{ borderColor: palette.border }}>
          <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
            <div className="bg-[#202020] p-7 md:p-9">
              <p className="text-sm font-semibold leading-7 text-white/70">“Communication access should be clear, professional, and centered on the people who need to understand each other.”</p>
            </div>
            <div className="flex flex-col justify-center gap-4 bg-white p-7 md:min-w-[340px] md:p-9">
              <p className="text-sm leading-6 text-[#5f6368]">Ready to start a request?</p>
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request Services <ArrowRight size={17} /></Link>
              <Link to="/services" className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>View Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
