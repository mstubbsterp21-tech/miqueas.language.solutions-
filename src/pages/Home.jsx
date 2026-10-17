import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { formatBlogDate, getBlogPostImage, getFeaturedBlogPost } from "../content/blogPostsLive";
import MlsSitePhoto from "../components/MlsSitePhoto";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const serviceCards = [
  { icon: Users, title: "In-Person Interpreting", path: "/services/in-person-interpreting", image: "in-person-interpreting", copy: "On-site access for appointments, meetings, events, and live settings." },
  { icon: Video, title: "Video Remote Interpreting", path: "/services/video-remote-interpreting", image: "video-remote-interpreting", copy: "Real-time ASL access for virtual meetings, telehealth, and remote support." },
  { icon: FileVideo, title: "English → ASL Translation", path: "/services/english-asl-translation", image: "english-asl-translation", copy: "Recorded ASL video translation for public-facing or internal information." },
  { icon: Globe, title: "ASL → English Translation", path: "/services/asl-english-translation", image: "asl-english-translation", copy: "Transcripts, captions, summaries, and English-ready documentation." },
];

export default function Home({ palette }) {
  const reduceMotion = useReducedMotion();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const featuredArticle = getFeaturedBlogPost();
  const featuredImage = getBlogPostImage(featuredArticle);

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
        "I had the pleasure of working with this interpreter during my web development courses. His clarity and professionalism were unmatched. Unlike many interpreters I’ve encountered, he ensured I fully understood everything and clarified when needed. I even told my agency I want him every time! If you need an interpreter who is clear, reliable, and respectful, he is the one.",
      role: "Deaf Consumer – Web Development Education",
    },
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
    if (reduceMotion) return undefined;
    const interval = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonials.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [testimonials.length, reduceMotion]);

  const goToPreviousTestimonial = () => {
    setActiveTestimonial((current) => (current === 0 ? testimonials.length - 1 : current - 1));
  };

  const goToNextTestimonial = () => {
    setActiveTestimonial((current) => (current + 1) % testimonials.length);
  };

  const goldButton = { backgroundColor: palette.gold, color: palette.white };
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  return (
    <div className="mls-public-site overflow-hidden bg-white">
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
                <Link to="/contact" className="mls-cta-motion inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>
                  Request an Interpreter
                  <ArrowRight size={17} />
                </Link>
                <Link to="/join-our-team" className="mls-cta-motion inline-flex items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
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

            <div className="relative mx-auto w-full max-w-[560px] lg:mx-0">
              <div className="mls-ambient-orb pointer-events-none absolute -right-4 -top-5 h-32 w-32 rounded-full bg-[#dd7d00]/20 blur-2xl" />
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-[#f7f3ef] shadow-[0_28px_70px_-28px_rgba(70,24,10,0.4)]"
              >
                <MlsSitePhoto
                  name="home-hero"
                  alt="Diverse participants communicating with ASL interpretation in a professional meeting"
                  priority
                  className="!rounded-none aspect-[4/3] object-cover"
                />
              </motion.div>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3 }}
                className="relative z-10 -mt-7 ml-auto w-[92%] rounded-[1.35rem] border border-white/10 bg-[#202020] px-5 py-5 text-white shadow-2xl sm:w-[80%] sm:px-7"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: palette.gold }}>People first. Access always.</p>
                <p className="mt-2 text-xl font-black leading-snug">Communication access that puts the conversation—not the process—first.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-white/75">
                  <span className="rounded-full border border-white/20 px-3 py-1">In person</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">Remote</span>
                  <span className="rounded-full border border-white/20 px-3 py-1">ASL translation</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>


      <section className="border-y border-[#721100]/10 bg-[#faf7f3] px-5 py-9 md:px-8 md:py-12" aria-labelledby="mls-sectors-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: palette.burgundy }}>Who we support</p>
              <h2 id="mls-sectors-heading" className="mt-2 text-2xl font-black md:text-3xl" style={{ color: palette.charcoal }}>Communication matters in every setting.</h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: palette.burgundy }}>Explore services <ArrowRight size={16} /></Link>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sectors.map(({ icon: Icon, label, description }, index) => (
              <motion.div key={label} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.4, delay: index * 0.08 }} className="rounded-[1.3rem] border border-[#721100]/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <Icon size={24} style={{ color: palette.gold }} />
                <h3 className="mt-3 text-base font-black" style={{ color: palette.charcoal }}>{label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#656565]">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Services</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Choose the service path that fits the communication need.</h2>
          </motion.div>
          <div className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-12">
            {serviceCards.map(({ icon: Icon, title, path, copy, image }, index) => (
              <motion.article
                key={title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.15 }}
                variants={fadeUp}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.7rem] border border-[#721100]/10 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${index === 0 || index === 3 ? "lg:col-span-7" : "lg:col-span-5"}`}
              >
                <Link to={path} className="block overflow-hidden bg-[#f7f3ef] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#dd7d00]" aria-label={`Explore ${title}`}>
                  <MlsSitePhoto name={image} alt={`Illustration of ${title.toLowerCase()} in a professional setting`} className="!rounded-none aspect-[16/11] object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:transform-none" />
                </Link>
                <div className="flex flex-1 flex-col px-6 pb-7 pt-6 md:px-8">
                  <div className="mb-3 flex items-center gap-3">
                    <Icon size={22} style={{ color: palette.gold }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.burgundy }}>MLS Services</span>
                  </div>
                  <h3 className="text-2xl font-black leading-tight" style={{ color: palette.charcoal }}>{title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#626262]">{copy}</p>
                  <Link to={path} className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-bold group-hover:gap-3 transition-all" style={{ color: palette.burgundy }}>Explore service <ArrowRight size={16} /></Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {featuredArticle && (
        <section className="px-5 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <motion.article initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[2.2rem] border bg-white shadow-xl" style={{ borderColor: palette.border }}>
              <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex min-h-[320px] flex-col bg-[#202020] text-white">
                  <Link
                    to={`/blog/${featuredArticle.slug}`}
                    aria-label={`Read featured article: ${featuredArticle.title}`}
                    className="group relative block min-h-[250px] flex-1 overflow-hidden bg-[#211714] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#dd7d00] lg:min-h-[340px]"
                  >
                    {featuredImage ? (
                      <>
                        <img
                          src={featuredImage.src}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
                        />
                        <img
                          src={featuredImage.src}
                          alt={featuredImage.alt}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      </>
                    ) : (
                      <div className="flex h-full min-h-[250px] flex-col items-center justify-center gap-3 p-8 text-center">
                        <FileText size={40} style={{ color: palette.gold }} />
                        <span className="text-sm font-bold">Featured article image unavailable</span>
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-5 text-xs text-white/80 md:px-8">
                    <span className="font-bold uppercase tracking-[0.15em]" style={{ color: palette.gold }}>Featured Article</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} style={{ color: palette.gold }} />{formatBlogDate(featuredArticle.publishDate)}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={15} style={{ color: palette.gold }} />{featuredArticle.readTime}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-7 md:p-9">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{featuredArticle.category}</p>
                  <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl" style={{ color: palette.charcoal }}>{featuredArticle.title}</h2>
                  <p className="mt-4 text-lg leading-8 text-[#555]">{featuredArticle.excerpt}</p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to={`/blog/${featuredArticle.slug}`} className="mls-cta-motion inline-flex w-fit items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: palette.burgundy }}>
                      Read Featured Article
                      <ArrowRight size={17} />
                    </Link>
                    <Link to="/blog" className="mls-cta-motion inline-flex w-fit items-center justify-center rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>
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
              <Link to="/contact" className="mls-cta-motion inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={goldButton}>Request Services <ArrowRight size={17} /></Link>
              <Link to="/services" className="mls-cta-motion inline-flex items-center justify-center gap-2 rounded-full border bg-white px-6 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: palette.border, color: palette.charcoal }}>View Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}