import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, FileText } from "lucide-react";
import { formatBlogDate, getPublishedBlogPosts } from "../content/blogPosts";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function Blog({ palette }) {
  const posts = getPublishedBlogPosts();
  const featuredPost = posts.find((post) => post.featured) || posts[0];
  const remainingPosts = posts.filter((post) => post.slug !== featuredPost?.slug);

  return (
    <div className="overflow-hidden bg-white">
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(114,17,0,0.12), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.55 }} className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.burgundy }}>
              <FileText size={15} style={{ color: palette.gold }} />
              MLS Blog
            </div>
            <h1 className="text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
              Practical guidance for clearer communication access.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555] md:text-xl">
              Helpful articles for clients, interpreters, and Deaf or hard-of-hearing consumers. New posts can be scheduled in advance by setting a future publish date.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          {featuredPost ? (
            <motion.article initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.45 }} className="overflow-hidden rounded-[2.2rem] border bg-white shadow-xl" style={{ borderColor: palette.border }}>
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="flex min-h-[320px] flex-col justify-between bg-[#202020] p-7 text-white md:p-9">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.gold }}>Featured Article</p>
                    <h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl">{featuredPost.title}</h2>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-2"><CalendarDays size={16} style={{ color: palette.gold }} />{formatBlogDate(featuredPost.publishDate)}</span>
                    <span className="inline-flex items-center gap-2"><Clock size={16} style={{ color: palette.gold }} />{featuredPost.readTime}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center p-7 md:p-9">
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{featuredPost.category}</p>
                  <p className="mt-4 text-lg leading-8 text-[#555]">{featuredPost.excerpt}</p>
                  <Link to={`/blog/${featuredPost.slug}`} className="mt-7 inline-flex w-fit items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: palette.burgundy }}>
                    Read Article
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </motion.article>
          ) : (
            <div className="rounded-[2rem] border bg-[#fafafa] p-8 text-center" style={{ borderColor: palette.border }}>
              <h2 className="text-2xl font-black" style={{ color: palette.charcoal }}>No posts published yet.</h2>
              <p className="mt-3 text-[#666]">Scheduled posts will appear here automatically when their publish date arrives.</p>
            </div>
          )}

          {remainingPosts.length > 0 && (
            <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post, index) => (
                <motion.article key={post.slug} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} transition={{ duration: 0.45, delay: index * 0.04 }} className="flex flex-col rounded-[1.6rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: palette.border }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>{post.category}</p>
                  <h2 className="mt-3 text-xl font-black leading-tight" style={{ color: palette.charcoal }}>{post.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-7 text-[#666]">{post.excerpt}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-[#777]">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} style={{ color: palette.gold }} />{formatBlogDate(post.publishDate)}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={14} style={{ color: palette.gold }} />{post.readTime}</span>
                  </div>
                  <Link to={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-75" style={{ color: palette.burgundy }}>
                    Read Article
                    <ArrowRight size={16} />
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
