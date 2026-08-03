import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { formatBlogDate, getPublishedBlogPostBySlug } from "../content/blogPostsLive";

function setMetaAttribute(attribute, key, content) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function setCanonicalUrl(url) {
  let tag = document.head.querySelector('link[rel="canonical"]');

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", url);
}

function getPostImage(post) {
  const imageMatch = post?.html?.match(/<img\b[^>]*src=["']([^"']+)["']/i);
  return imageMatch?.[1] || `${window.location.origin}/preview.png`;
}

function renderBlock(block, index, palette) {
  if (block.type === "heading") {
    return (
      <h2 key={index} className="mt-10 text-2xl font-black tracking-tight md:text-3xl" style={{ color: palette.charcoal }}>
        {block.text}
      </h2>
    );
  }

  if (block.type === "list") {
    return (
      <ul key={index} className="mt-5 space-y-3">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-8 text-[#555]">
            <span className="mt-3 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: palette.gold }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} className="mt-5 text-base leading-8 text-[#555] md:text-lg">
      {block.text}
    </p>
  );
}

export default function BlogPost({ palette }) {
  const { slug } = useParams();
  const post = getPublishedBlogPostBySlug(slug);

  useEffect(() => {
    if (!post) return;

    const canonicalUrl = `${window.location.origin}/blog/${post.slug}`;
    const pageTitle = `${post.title} | Miqueas Language Solutions`;
    const imageUrl = getPostImage(post);

    document.title = pageTitle;
    setMetaAttribute("name", "description", post.excerpt);
    setMetaAttribute("name", "robots", "index, follow");
    setCanonicalUrl(canonicalUrl);
    setMetaAttribute("property", "og:title", pageTitle);
    setMetaAttribute("property", "og:description", post.excerpt);
    setMetaAttribute("property", "og:url", canonicalUrl);
    setMetaAttribute("property", "og:type", "article");
    setMetaAttribute("property", "og:image", imageUrl);
    setMetaAttribute("name", "twitter:title", pageTitle);
    setMetaAttribute("name", "twitter:description", post.excerpt);
    setMetaAttribute("name", "twitter:image", imageUrl);
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <article className="overflow-hidden bg-white">
      <style>{`
        .blog-html > *:first-child { margin-top: 0; }
        .blog-html p { margin-top: 1.25rem; color: #555; font-size: 1.0625rem; line-height: 1.85; }
        .blog-html h2 { margin-top: 2.75rem; color: var(--mls-charcoal); font-size: clamp(1.75rem, 3vw, 2.35rem); font-weight: 900; line-height: 1.15; letter-spacing: -0.03em; }
        .blog-html h3 { margin-top: 2rem; color: var(--mls-burgundy); font-size: 1.35rem; font-weight: 900; line-height: 1.25; }
        .blog-html img { width: 100%; border-radius: 1.5rem; border: 1px solid var(--mls-border); box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
        .blog-html a { color: var(--mls-burgundy); font-weight: 800; text-decoration: underline; text-underline-offset: 4px; }
        .blog-html hr { margin: 2.75rem 0; border: 0; border-top: 1px solid var(--mls-border); }
        .blog-html ol { margin-top: 1.25rem; padding-left: 1.4rem; list-style: decimal; color: #555; }
        .blog-html ul { margin-top: 1.25rem; padding-left: 1.4rem; list-style: disc; color: #555; }
        .blog-html li { margin-top: 0.85rem; padding-left: 0.25rem; font-size: 1.0625rem; line-height: 1.8; }
        .blog-html strong { color: var(--mls-charcoal); font-weight: 900; }
        .blog-html blockquote { margin-top: 2rem; border-left: 5px solid var(--mls-gold); border-radius: 1.5rem; background: #fafafa; padding: 1.25rem 1.4rem; }
        .blog-html blockquote p { margin-top: 0; }
      `}</style>
      <section className="relative px-5 py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 15% 15%, rgba(221,125,0,0.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(114,17,0,0.12), transparent 32%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
        <div className="mx-auto max-w-4xl">
          <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-75" style={{ color: palette.burgundy }}>
            <ArrowLeft size={17} />
            Back to Blog
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.gold }}>{post.category}</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>{post.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#555] md:text-xl">{post.excerpt}</p>
          <div className="mt-7 flex flex-wrap gap-4 text-sm font-semibold text-[#666]">
            <span className="inline-flex items-center gap-2"><CalendarDays size={16} style={{ color: palette.gold }} />{formatBlogDate(post.publishDate)}</span>
            <span className="inline-flex items-center gap-2"><Clock size={16} style={{ color: palette.gold }} />{post.readTime}</span>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-6 shadow-sm md:p-9" style={{ borderColor: palette.border, "--mls-border": palette.border, "--mls-burgundy": palette.burgundy, "--mls-charcoal": palette.charcoal, "--mls-gold": palette.gold }}>
          {post.html ? (
            <div className="blog-html" dangerouslySetInnerHTML={{ __html: post.html }} />
          ) : (
            post.content.map((block, index) => renderBlock(block, index, palette))
          )}
        </div>
      </section>
    </article>
  );
}
