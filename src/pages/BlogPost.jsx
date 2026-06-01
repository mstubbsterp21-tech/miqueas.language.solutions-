import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { formatBlogDate, getPublishedBlogPostBySlug } from "../content/blogPosts";

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

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <article className="overflow-hidden bg-white">
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
        <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-6 shadow-sm md:p-9" style={{ borderColor: palette.border }}>
          {post.content.map((block, index) => renderBlock(block, index, palette))}
        </div>
      </section>
    </article>
  );
}
