import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  FolderOpen,
  Layers3,
  Sparkles,
} from "lucide-react";
import { formatBlogDate, getPublishedBlogPosts } from "../content/blogPostsLive";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const staggerGroup = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
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
    ? "radial-gradient(circle at 12% 10%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 88% 15%, rgba(114,17,0,0.28), transparent 30%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 12% 10%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 88% 15%, rgba(114,17,0,0.12), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";

  return { accentText, heroGradient };
}

function getMonthKey(publishDate) {
  return publishDate.slice(0, 7);
}

function formatMonthLabel(publishDate) {
  const [year, month] = publishDate.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function groupPostsByMonth(posts) {
  const groups = new Map();

  posts.forEach((post) => {
    const key = getMonthKey(post.publishDate);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatMonthLabel(post.publishDate),
        posts: [],
      });
    }

    groups.get(key).posts.push(post);
  });

  return Array.from(groups.values());
}

function PostMeta({ post, palette, light = false }) {
  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
      style={{ color: light ? "rgba(255,255,255,0.82)" : palette.body }}
    >
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

function ArticleCard({ post, palette, accentText, highlighted = false }) {
  const postImage = getPostImage(post);
  const linkClasses = highlighted
    ? "grid h-full md:grid-cols-[1.08fr_0.92fr]"
    : "flex h-full flex-col";
  const imageClasses = highlighted
    ? "h-56 w-full object-cover transition duration-500 group-hover:scale-105 md:h-full md:min-h-[320px]"
    : "h-52 w-full object-cover transition duration-500 group-hover:scale-105";

  return (
    <motion.article
      variants={fadeUp}
      transition={{ duration: 0.42 }}
      className={`group overflow-hidden rounded-[1.75rem] border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        highlighted ? "md:col-span-2" : ""
      }`}
      style={{ borderColor: palette.border, backgroundColor: palette.white }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className={`${linkClasses} focus:outline-none focus:ring-4`}
        style={{ "--tw-ring-color": "rgba(221, 125, 0, 0.35)" }}
        aria-label={`Read ${post.title}`}
      >
        <div className="relative overflow-hidden" style={{ backgroundColor: palette.softGray }}>
          {postImage ? (
            <img src={postImage.src} alt={postImage.alt} className={imageClasses} />
          ) : (
            <div
              className={`flex items-center justify-center ${
                highlighted ? "h-56 md:h-full md:min-h-[320px]" : "h-52"
              }`}
              style={{
                background:
                  "linear-gradient(135deg, rgba(221,125,0,0.20), rgba(114,17,0,0.16))",
              }}
            >
              <FileText size={40} style={{ color: accentText }} />
            </div>
          )}

          <div
            className="absolute left-4 top-4 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] shadow-sm backdrop-blur"
            style={{
              borderColor: palette.border,
              color: accentText,
              backgroundColor: palette.white,
            }}
          >
            {post.category}
          </div>
        </div>

        <div
          className={`flex flex-1 flex-col ${highlighted ? "p-7 md:p-8" : "p-6"}`}
          style={{ backgroundColor: palette.white }}
        >
          {highlighted && (
            <p
              className="mb-3 inline-flex w-fit items-center gap-2 text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: palette.gold }}
            >
              <Sparkles size={14} />
              Month highlight
            </p>
          )}

          <h3
            className={`font-black leading-tight tracking-tight transition group-hover:opacity-85 ${
              highlighted ? "text-2xl md:text-3xl" : "text-xl"
            }`}
            style={{ color: palette.charcoal }}
          >
            {post.title}
          </h3>

          <p
            className={`mt-4 flex-1 leading-7 ${highlighted ? "text-base" : "text-sm"}`}
            style={{ color: palette.body }}
          >
            {post.excerpt}
          </p>

          <div className="mt-5">
            <PostMeta post={post} palette={palette} />
          </div>

          <span
            className="mt-6 inline-flex items-center gap-2 text-sm font-black transition group-hover:gap-3"
            style={{ color: accentText }}
          >
            Read Article
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Blog({ palette }) {
  const posts = getPublishedBlogPosts();
  const monthGroups = groupPostsByMonth(posts);
  const latestPost = posts[0];
  const latestImage = getPostImage(latestPost);
  const categoryCount = new Set(posts.map((post) => post.category)).size;
  const { accentText, heroGradient } = getThemeStyles(palette);

  return (
    <div className="overflow-hidden" style={{ backgroundColor: palette.white }}>
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: heroGradient }} />

        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.55 }}
          >
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-sm"
              style={{
                borderColor: palette.border,
                color: accentText,
                backgroundColor: palette.white,
              }}
            >
              <BookOpen size={15} style={{ color: palette.gold }} />
              MLS Blog
            </div>

            <h1
              className="max-w-3xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl"
              style={{ color: palette.charcoal }}
            >
              Communication access guidance, organized for easier reading.
            </h1>

            <p
              className="mt-6 max-w-2xl text-lg leading-8 md:text-xl"
              style={{ color: palette.body }}
            >
              Explore practical articles for organizations, interpreters, and Deaf community
              members—now grouped by month so you can find recent guidance and revisit older
              resources quickly.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                { value: posts.length, label: "Articles" },
                { value: monthGroups.length, label: "Months" },
                { value: categoryCount, label: "Topics" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border p-4 shadow-sm"
                  style={{ borderColor: palette.border, backgroundColor: palette.white }}
                >
                  <p className="text-2xl font-black" style={{ color: palette.charcoal }}>
                    {item.value}
                  </p>
                  <p
                    className="mt-1 text-[11px] font-black uppercase tracking-[0.16em]"
                    style={{ color: accentText }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {latestPost && (
            <motion.article
              initial={{ opacity: 0, scale: 0.97, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="group overflow-hidden rounded-[2rem] border shadow-2xl"
              style={{ borderColor: palette.border, backgroundColor: palette.white }}
            >
              <Link
                to={`/blog/${latestPost.slug}`}
                className="block focus:outline-none focus:ring-4"
                style={{ "--tw-ring-color": "rgba(221, 125, 0, 0.35)" }}
              >
                <div className="relative h-64 overflow-hidden bg-[#202020]">
                  {latestImage ? (
                    <img
                      src={latestImage.src}
                      alt={latestImage.alt}
                      className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full"
                      style={{
                        background:
                          "linear-gradient(135deg, #202020 0%, #721100 58%, #dd7d00 100%)",
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.04) 15%, rgba(0,0,0,0.76) 100%)",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
                    <p
                      className="text-xs font-black uppercase tracking-[0.2em]"
                      style={{ color: palette.gold }}
                    >
                      Newest Article
                    </p>
                    <h2 className="mt-3 text-2xl font-black leading-tight md:text-3xl">
                      {latestPost.title}
                    </h2>
                    <div className="mt-4">
                      <PostMeta post={latestPost} palette={palette} light />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 p-5 md:p-6">
                  <p className="text-sm leading-6" style={{ color: palette.body }}>
                    {latestPost.excerpt}
                  </p>
                  <span
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition group-hover:translate-x-1 sm:flex"
                    style={{ backgroundColor: palette.burgundy }}
                  >
                    <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            </motion.article>
          )}
        </div>
      </section>

      {monthGroups.length > 0 && (
        <div
          className="sticky top-[64px] z-20 border-y px-5 py-3 backdrop-blur-xl md:top-[72px] md:px-8"
          style={{
            borderColor: palette.border,
            backgroundColor: `${palette.white}F2`,
          }}
        >
          <nav
            aria-label="Browse blog posts by month"
            className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto pb-1"
          >
            <span
              className="mr-1 inline-flex shrink-0 items-center gap-2 text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: palette.charcoal }}
            >
              <FolderOpen size={15} style={{ color: palette.gold }} />
              Browse
            </span>

            {monthGroups.map((group) => (
              <a
                key={group.key}
                href={`#month-${group.key}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus:ring-4"
                style={{
                  borderColor: palette.border,
                  color: accentText,
                  backgroundColor: palette.white,
                  "--tw-ring-color": "rgba(221, 125, 0, 0.35)",
                }}
              >
                {group.label}
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ color: palette.charcoal, backgroundColor: palette.softGray }}
                >
                  {group.posts.length}
                </span>
              </a>
            ))}
          </nav>
        </div>
      )}

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          {monthGroups.length > 0 ? (
            <div className="space-y-16 md:space-y-20">
              {monthGroups.map((group, groupIndex) => (
                <section
                  key={group.key}
                  id={`month-${group.key}`}
                  className="scroll-mt-24"
                  aria-labelledby={`month-heading-${group.key}`}
                >
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    variants={fadeUp}
                    transition={{ duration: 0.4 }}
                    className="mb-7 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between"
                    style={{ borderColor: palette.border }}
                  >
                    <div>
                      <p
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]"
                        style={{ color: palette.gold }}
                      >
                        <Layers3 size={15} />
                        Monthly Archive
                      </p>
                      <h2
                        id={`month-heading-${group.key}`}
                        className="mt-3 text-3xl font-black tracking-tight md:text-4xl"
                        style={{ color: palette.charcoal }}
                      >
                        {group.label}
                      </h2>
                    </div>

                    <p
                      className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold"
                      style={{
                        borderColor: palette.border,
                        color: accentText,
                        backgroundColor: palette.softGray,
                      }}
                    >
                      {group.posts.length} {group.posts.length === 1 ? "article" : "articles"}
                    </p>
                  </motion.div>

                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.08 }}
                    variants={staggerGroup}
                    className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {group.posts.map((post, postIndex) => (
                      <ArticleCard
                        key={post.slug}
                        post={post}
                        palette={palette}
                        accentText={accentText}
                        highlighted={postIndex === 0 && group.posts.length > 2}
                      />
                    ))}
                  </motion.div>

                  {groupIndex < monthGroups.length - 1 && (
                    <div className="mt-12 flex items-center gap-4" aria-hidden="true">
                      <div className="h-px flex-1" style={{ backgroundColor: palette.border }} />
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: palette.gold }}
                      />
                      <div className="h-px flex-1" style={{ backgroundColor: palette.border }} />
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div
              className="rounded-[2rem] border p-10 text-center"
              style={{ borderColor: palette.border, backgroundColor: palette.softGray }}
            >
              <FileText size={38} className="mx-auto" style={{ color: accentText }} />
              <h2 className="mt-5 text-2xl font-black" style={{ color: palette.charcoal }}>
                No posts published yet.
              </h2>
              <p className="mt-3" style={{ color: palette.body }}>
                Approved scheduled posts will appear here automatically when their publish date
                arrives.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
