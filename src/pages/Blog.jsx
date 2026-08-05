import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import { formatBlogDate, getPublishedBlogPosts } from "../content/blogPostsLive";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const staggerGroup = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
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
    ? "radial-gradient(circle at 12% 12%, rgba(221,125,0,0.12), transparent 30%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 12% 12%, rgba(221,125,0,0.10), transparent 30%), linear-gradient(180deg, #ffffff 0%, #f8f5f2 100%)";

  return { accentText, heroGradient };
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
    const key = post.publishDate.slice(0, 7);

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

function getSearchableText(post) {
  const bodyText = (post.html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ");

  return [post.title, post.excerpt, post.category, bodyText].join(" ").toLowerCase();
}

function PostMeta({ post, palette, light = false }) {
  return (
    <div
      className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
      style={{ color: light ? "rgba(255,255,255,0.82)" : palette.body }}
    >
      <span className="inline-flex items-center gap-2">
        <CalendarDays size={15} style={{ color: palette.gold }} />
        {formatBlogDate(post.publishDate)}
      </span>
      <span className="inline-flex items-center gap-2">
        <Clock size={15} style={{ color: palette.gold }} />
        {post.readTime}
      </span>
    </div>
  );
}

function FeaturedArticle({ post, palette, accentText }) {
  const postImage = getPostImage(post);

  return (
    <motion.article
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      transition={{ duration: 0.45 }}
      className="group overflow-hidden rounded-[1.6rem] border shadow-sm transition hover:shadow-lg"
      style={{ borderColor: palette.border, backgroundColor: palette.white }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="grid focus:outline-none focus:ring-4 lg:grid-cols-[1.05fr_0.95fr]"
        style={{ "--tw-ring-color": "rgba(221, 125, 0, 0.28)" }}
        aria-label={`Read featured article: ${post.title}`}
      >
        <div className="h-64 overflow-hidden lg:h-full lg:min-h-[360px]" style={{ backgroundColor: palette.softGray }}>
          {postImage ? (
            <img
              src={postImage.src}
              alt={postImage.alt}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(221,125,0,0.14), rgba(114,17,0,0.10))",
              }}
            >
              <FileText size={42} style={{ color: accentText }} />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-7 md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: accentText }}>
            Featured article
          </p>
          <p className="mt-4 text-sm font-bold" style={{ color: palette.body }}>
            {post.category}
          </p>
          <h2
            className="mt-3 text-2xl font-black leading-tight tracking-tight md:text-3xl"
            style={{ color: palette.charcoal }}
          >
            {post.title}
          </h2>
          <p className="mt-4 text-base leading-7" style={{ color: palette.body }}>
            {post.excerpt}
          </p>
          <div className="mt-5">
            <PostMeta post={post} palette={palette} />
          </div>
          <span
            className="mt-7 inline-flex items-center gap-2 text-sm font-black transition group-hover:gap-3"
            style={{ color: accentText }}
          >
            Read article
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function CardArticle({ post, palette, accentText }) {
  const postImage = getPostImage(post);

  return (
    <motion.article
      variants={fadeUp}
      transition={{ duration: 0.4 }}
      className="group overflow-hidden rounded-[1.4rem] border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: palette.border, backgroundColor: palette.white }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="flex h-full flex-col focus:outline-none focus:ring-4"
        style={{ "--tw-ring-color": "rgba(221, 125, 0, 0.28)" }}
        aria-label={`Read ${post.title}`}
      >
        <div className="h-52 overflow-hidden" style={{ backgroundColor: palette.softGray }}>
          {postImage ? (
            <img
              src={postImage.src}
              alt={postImage.alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(221,125,0,0.14), rgba(114,17,0,0.10))",
              }}
            >
              <FileText size={36} style={{ color: accentText }} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: accentText }}>
            {post.category}
          </p>
          <h3
            className="mt-3 text-xl font-black leading-tight tracking-tight transition group-hover:opacity-85"
            style={{ color: palette.charcoal }}
          >
            {post.title}
          </h3>
          <p className="mt-4 flex-1 text-sm leading-7" style={{ color: palette.body }}>
            {post.excerpt}
          </p>
          <div className="mt-5">
            <PostMeta post={post} palette={palette} />
          </div>
          <span
            className="mt-6 inline-flex items-center gap-2 text-sm font-black transition group-hover:gap-3"
            style={{ color: accentText }}
          >
            Read article
            <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function ListArticle({ post, palette, accentText }) {
  const postImage = getPostImage(post);

  return (
    <motion.article
      variants={fadeUp}
      transition={{ duration: 0.4 }}
      className="group overflow-hidden rounded-[1.25rem] border shadow-sm transition duration-300 hover:shadow-md"
      style={{ borderColor: palette.border, backgroundColor: palette.white }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="grid focus:outline-none focus:ring-4 md:grid-cols-[220px_1fr]"
        style={{ "--tw-ring-color": "rgba(221, 125, 0, 0.28)" }}
        aria-label={`Read ${post.title}`}
      >
        <div className="h-48 overflow-hidden md:h-full md:min-h-[210px]" style={{ backgroundColor: palette.softGray }}>
          {postImage ? (
            <img
              src={postImage.src}
              alt={postImage.alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(221,125,0,0.14), rgba(114,17,0,0.10))",
              }}
            >
              <FileText size={34} style={{ color: accentText }} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-5 p-6 md:p-7">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: accentText }}>
              {post.category}
            </p>
            <h3
              className="mt-3 text-xl font-black leading-tight tracking-tight md:text-2xl"
              style={{ color: palette.charcoal }}
            >
              {post.title}
            </h3>
            <p className="mt-3 text-sm leading-7" style={{ color: palette.body }}>
              {post.excerpt}
            </p>
            <div className="mt-4">
              <PostMeta post={post} palette={palette} />
            </div>
          </div>
          <ArrowRight
            size={20}
            className="hidden shrink-0 transition group-hover:translate-x-1 sm:block"
            style={{ color: accentText }}
          />
        </div>
      </Link>
    </motion.article>
  );
}

export default function Blog({ palette }) {
  const posts = useMemo(() => getPublishedBlogPosts(), []);
  const featuredPost = posts.find((post) => post.featured) || posts[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "card";
    return window.localStorage.getItem("mls-blog-view") === "list" ? "list" : "card";
  });
  const { accentText, heroGradient } = getThemeStyles(palette);
  const hasSearch = searchTerm.trim().length > 0;

  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return posts;

    return posts.filter((post) => getSearchableText(post).includes(query));
  }, [posts, searchTerm]);

  const archivePosts = useMemo(() => {
    if (hasSearch || !featuredPost) return filteredPosts;
    return filteredPosts.filter((post) => post.slug !== featuredPost.slug);
  }, [featuredPost, filteredPosts, hasSearch]);

  const monthGroups = useMemo(() => groupPostsByMonth(archivePosts), [archivePosts]);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mls-blog-view", mode);
    }
  };

  return (
    <div className="overflow-hidden" style={{ backgroundColor: palette.white }}>
      <section className="relative px-5 py-16 md:px-8 md:py-24">
        <div className="absolute inset-0 -z-10" style={{ background: heroGradient }} />
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1
            className="text-4xl font-black leading-[1.04] tracking-tight md:text-6xl"
            style={{ color: palette.charcoal }}
          >
            Practical guidance for better communication access.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 md:text-xl" style={{ color: palette.body }}>
            Articles for organizations, interpreters, and Deaf community members, organized by month for simple browsing.
          </p>
        </motion.div>
      </section>

      {featuredPost && (
        <section className="px-5 py-10 md:px-8 md:py-14">
          <div className="mx-auto max-w-6xl">
            <FeaturedArticle post={featuredPost} palette={palette} accentText={accentText} />
          </div>
        </section>
      )}

      <section className="border-y px-5 py-5 md:px-8" style={{ borderColor: palette.border }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="blog-search" className="sr-only">
                Search blog articles
              </label>
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: palette.body }}
              />
              <input
                id="blog-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search articles"
                className="w-full rounded-xl border py-3.5 pl-12 pr-11 text-base outline-none transition focus:ring-4"
                style={{
                  borderColor: palette.border,
                  color: palette.charcoal,
                  backgroundColor: palette.white,
                  "--tw-ring-color": "rgba(221, 125, 0, 0.22)",
                }}
              />
              {hasSearch && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition hover:opacity-70"
                  style={{ color: palette.body }}
                  aria-label="Clear article search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div
              className="inline-flex w-fit rounded-xl border p-1"
              style={{ borderColor: palette.border, backgroundColor: palette.softGray }}
              aria-label="Article view options"
            >
              <button
                type="button"
                onClick={() => changeViewMode("card")}
                className="flex h-10 w-11 items-center justify-center rounded-lg transition"
                style={{
                  color: viewMode === "card" ? accentText : palette.body,
                  backgroundColor: viewMode === "card" ? palette.white : "transparent",
                  boxShadow: viewMode === "card" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
                aria-label="Show articles as cards"
                aria-pressed={viewMode === "card"}
                title="Card view"
              >
                <LayoutGrid size={19} />
              </button>
              <button
                type="button"
                onClick={() => changeViewMode("list")}
                className="flex h-10 w-11 items-center justify-center rounded-lg transition"
                style={{
                  color: viewMode === "list" ? accentText : palette.body,
                  backgroundColor: viewMode === "list" ? palette.white : "transparent",
                  boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
                aria-label="Show articles as a list"
                aria-pressed={viewMode === "list"}
                title="List view"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {!hasSearch && monthGroups.length > 1 && (
            <nav
              aria-label="Browse blog posts by month"
              className="mt-4 flex gap-6 overflow-x-auto pb-1 text-sm font-bold"
            >
              {monthGroups.map((group) => (
                <a
                  key={group.key}
                  href={`#month-${group.key}`}
                  className="shrink-0 border-b-2 border-transparent py-1 transition hover:border-current"
                  style={{ color: accentText }}
                >
                  {group.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          {monthGroups.length > 0 ? (
            <div className="space-y-14 md:space-y-16">
              {monthGroups.map((group) => (
                <section
                  key={group.key}
                  id={`month-${group.key}`}
                  className="scroll-mt-24"
                  aria-labelledby={`month-heading-${group.key}`}
                >
                  <motion.h2
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={fadeUp}
                    transition={{ duration: 0.4 }}
                    id={`month-heading-${group.key}`}
                    className="mb-7 border-b pb-4 text-3xl font-black tracking-tight md:text-4xl"
                    style={{ color: palette.charcoal, borderColor: palette.border }}
                  >
                    {group.label}
                  </motion.h2>

                  <motion.div
                    key={`${group.key}-${viewMode}`}
                    initial="hidden"
                    animate="show"
                    variants={staggerGroup}
                    className={
                      viewMode === "card"
                        ? "grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-5"
                    }
                  >
                    {group.posts.map((post) =>
                      viewMode === "card" ? (
                        <CardArticle
                          key={`card-${post.slug}`}
                          post={post}
                          palette={palette}
                          accentText={accentText}
                        />
                      ) : (
                        <ListArticle
                          key={`list-${post.slug}`}
                          post={post}
                          palette={palette}
                          accentText={accentText}
                        />
                      ),
                    )}
                  </motion.div>
                </section>
              ))}
            </div>
          ) : hasSearch ? (
            <div className="py-16 text-center">
              <h2 className="text-2xl font-black" style={{ color: palette.charcoal }}>
                No articles found.
              </h2>
              <p className="mt-3" style={{ color: palette.body }}>
                Try a different search term.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-6 rounded-xl border px-5 py-2.5 text-sm font-bold transition hover:shadow-sm"
                style={{ borderColor: palette.border, color: accentText, backgroundColor: palette.white }}
              >
                Clear search
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}