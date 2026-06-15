import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays, Clock, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { formatBlogDate, getPublishedBlogPosts } from "../content/blogPostsLive";
import logo from "../logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const staggerGroup = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function getPostImage(post) {
  const html = post?.html || "";
  const imgTag = html.match(/<img\b[^>]*>/i)?.[0];

  if (!imgTag) return null;

  const src = imgTag.match(/src=["']([^"']+)["']/i)?.[1];
  const alt = imgTag.match(/alt=["']([^"']*)["']/i)?.[1] || `${post.title} visual`;

  return src ? { src, alt } : null;
}

function getThemeStyles(palette) {
  const isDark = palette.white !== "#ffffff";
  const accentText = isDark ? palette.gold : palette.burgundy;
  const heroGradient = isDark
    ? "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(221,125,0,0.10), transparent 32%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(114,17,0,0.12), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";
  const cardGradient = isDark
    ? "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.16), transparent 26%), radial-gradient(circle at 92% 10%, rgba(221,125,0,0.10), transparent 28%), linear-gradient(135deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 26%), radial-gradient(circle at 92% 10%, rgba(114,17,0,0.14), transparent 28%), linear-gradient(135deg, #ffffff 0%, #f8f3ef 100%)";

  return { isDark, accentText, heroGradient, cardGradient };
}

function BlogBrandVisual({ palette }) {
  const { accentText, cardGradient } = getThemeStyles(palette);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.08 }}
      className="relative mx-auto mt-10 max-w-xl lg:mt-0"
    >
      <div className="absolute -left-6 top-8 h-28 w-28 rounded-full blur-2xl" style={{ backgroundColor: "rgba(221, 125, 0, 0.28)" }} />
      <div className="absolute -right-5 bottom-10 h-32 w-32 rounded-full blur-2xl" style={{ backgroundColor: "rgba(114, 17, 0, 0.20)" }} />

      <div className="relative overflow-hidden rounded-[2.4rem] border p-5 shadow-2xl backdrop-blur" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
        <div className="absolute inset-0 opacity-90" style={{ background: cardGradient }} />

        <div className="relative rounded-[1.9rem] border p-5 shadow-sm" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-white shadow-sm" style={{ borderColor: palette.border }}>
                <img src={logo} alt="Miqueas Language Solutions logo" className="h-12 w-auto object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: palette.gold }}>MLS Blog</p>
                <p className="mt-1 text-lg font-black leading-tight" style={{ color: palette.charcoal }}>Access insights that actually help.</p>
              </div>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-full text-white sm:flex" style={{ backgroundColor: palette.burgundy }}>
              <Sparkles size={20} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Healthcare", value: "Clear care" },
              { label: "Events", value: "Real access" },
              { label: "Planning", value: "Less scrambling" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.softGray }}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accentText }}>{item.label}</p>
                <p className="mt-2 text-sm font-black" style={{ color: palette.charcoal }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border" style={{ borderColor: palette.border }}>
            <div className="flex items-center gap-3 bg-[#202020] px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: palette.gold }}>
                <FileText size={17} />
              </div>
              <div>
                <p className="text-sm font-black">Approved MLS resources</p>
                <p className="text-xs text-white/70">Practical, ethical, consumer-centered guidance.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: palette.border }}>
              {[
                { Icon: ShieldCheck, text: "Ethics" },
                { Icon: BookOpen, text: "Prep" },
                { Icon: Sparkles, text: "Access" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2 px-3 py-4 text-center text-xs font-black" style={{ color: palette.charcoal, backgroundColor: palette.white }}>
                  <Icon size={18} style={{ color: accentText }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PostMeta({ post, palette, light = false }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm" style={{ color: light ? "rgba(255,255,255,0.78)" : palette.body }}>
      <span className="inline-flex items-center gap-2">
        <CalendarDays size={16} style={{ color: palette.gold }} />
        {formatBlogDate(post.publishDate)}
      </span>
      <span className="inline-flex items-center gap-2">
        <Clock size={16} style={{ color: palette.gold }} />
        {post.readTime}
      </span>
    </div>
  );
}

export default function Blog({ palette }) {
  const posts = getPublishedBlogPosts();
  const featuredPost = posts.find((post) => post.featured) || posts[0];
  const remainingPosts = posts.filter((post) => post.slug !== featuredPost?.slug);
  const featuredImage = getPostImage(featuredPost);
  const { accentText, heroGradient } = getThemeStyles(palette);

  return (
    <div className="overflow-hidden" style={{ backgroundColor: palette.white }}>
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: heroGradient }} />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: accentText, backgroundColor: palette.white }}>
              <FileText size={15} style={{ color: palette.gold }} />
              MLS Resource Hub
            </div>
            <h1 className="text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
              Practical guidance for clearer communication access.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 md:text-xl" style={{ color: palette.body }}>
              Readable, real-world insight for organizations, interpreters, and Deaf community members who want access handled with clarity, respect, and professional judgment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "ASL access planning",
                "Healthcare readiness",
                "Ethical practice",
              ].map((item) => (
                <span key={item} className="rounded-full border px-4 py-2 text-sm font-bold shadow-sm" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}>
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <BlogBrandVisual palette={palette} />
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16" style={{ backgroundColor: palette.white }}>
        <div className="mx-auto max-w-6xl">
          {featuredPost ? (
            <motion.article initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[2.2rem] border shadow-2xl" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[360px] overflow-hidden bg-[#202020]">
                  {featuredImage ? (
                    <img src={featuredImage.src} alt={featuredImage.alt} className="h-full min-h-[360px] w-full object-cover opacity-85" />
                  ) : (
                    <div className="h-full min-h-[360px]" style={{ background: "linear-gradient(135deg, #202020 0%, #721100 55%, #dd7d00 100%)" }} />
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)" }} />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9">
                    <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] backdrop-blur" style={{ color: palette.gold }}>Featured Article</p>
                    <h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl">{featuredPost.title}</h2>
                    <div className="mt-6">
                      <PostMeta post={featuredPost} palette={palette} light />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-7 md:p-10" style={{ backgroundColor: palette.white }}>
                  <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{featuredPost.category}</p>
                  <p className="mt-4 text-lg leading-8" style={{ color: palette.body }}>{featuredPost.excerpt}</p>
                  <div className="mt-7 rounded-2xl border p-5" style={{ borderColor: palette.border, backgroundColor: palette.softGray }}>
                    <p className="text-sm font-bold leading-7" style={{ color: palette.charcoal }}>
                      Built for people who need more than generic accessibility talk: practical steps, professional judgment, and communication access that holds up in real settings.
                    </p>
                  </div>
                  <Link to={`/blog/${featuredPost.slug}`} className="mt-7 inline-flex w-fit items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: palette.burgundy }}>
                    Read Featured Article
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </motion.article>
          ) : (
            <div className="rounded-[2rem] border p-8 text-center" style={{ borderColor: palette.border, backgroundColor: palette.softGray }}>
              <h2 className="text-2xl font-black" style={{ color: palette.charcoal }}>No posts published yet.</h2>
              <p className="mt-3" style={{ color: palette.body }}>Approved scheduled posts will appear here automatically when their publish date arrives.</p>
            </div>
          )}

          {remainingPosts.length > 0 && (
            <div className="mt-14">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: palette.gold }}>Latest Articles</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl" style={{ color: palette.charcoal }}>Choose the guide that fits your next access decision.</h2>
                </div>
                <p className="max-w-md text-sm leading-7" style={{ color: palette.body }}>
                  Each post is written to help you plan better, ask sharper questions, and avoid last-minute communication access problems.
                </p>
              </div>

              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} variants={staggerGroup} className="mt-8 grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post) => {
                  const postImage = getPostImage(post);
                  return (
                    <motion.article key={post.slug} variants={fadeUp} transition={{ duration: 0.45 }} className="group flex overflow-hidden rounded-[1.8rem] border shadow-sm transition hover:-translate-y-1 hover:shadow-2xl" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
                      <Link to={`/blog/${post.slug}`} className="flex w-full flex-col focus:outline-none focus:ring-4" style={{ "--tw-ring-color": "rgba(221, 125, 0, 0.35)" }}>
                        <div className="relative h-48 overflow-hidden" style={{ backgroundColor: palette.softGray }}>
                          {postImage ? (
                            <img src={postImage.src} alt={postImage.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(221,125,0,0.20), rgba(114,17,0,0.16))" }}>
                              <FileText size={38} style={{ color: accentText }} />
                            </div>
                          )}
                          <div className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm backdrop-blur" style={{ color: accentText, backgroundColor: palette.white }}>
                            {post.category}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-6" style={{ backgroundColor: palette.white }}>
                          <h3 className="text-xl font-black leading-tight transition group-hover:opacity-85" style={{ color: palette.charcoal }}>{post.title}</h3>
                          <p className="mt-3 flex-1 text-sm leading-7" style={{ color: palette.body }}>{post.excerpt}</p>
                          <div className="mt-5">
                            <PostMeta post={post} palette={palette} />
                          </div>
                          <span className="mt-5 inline-flex items-center gap-2 text-sm font-black transition group-hover:gap-3" style={{ color: accentText }}>
                            Read Article
                            <ArrowRight size={15} />
                          </span>
                        </div>
                      </Link>
                    </motion.article>
                  );
                })}
              </motion.div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
