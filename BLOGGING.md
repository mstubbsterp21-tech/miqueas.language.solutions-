# MLS Blog Publishing Guide

## Mandatory RID / CPC / legal pre-publication review

**New articles with publication dates after October 28, 2026 are held by default.** The date alone no longer makes a newly scheduled article public. The review-approval registry in `src/seo/blogReviewGate.js` must contain a record for the article slug, scheduled publication date, and a fingerprint matching the complete current title, excerpt, category, read time, and HTML/content. An edit after approval invalidates the fingerprint and automatically holds the article again.

The `MLS Pre-Publication Audit` runs Sunday evening in America/New_York, before the next Monday 12:00 AM Eastern publication time. It must check the full article (not just the summary), including all consequential legal, medical, privacy, credential, technical, and professional-practice claims, with current primary-source references. For each applicable issue, use the current RID Standard Practice Paper or Professional Practice Paper, NAD-RID Code of Professional Conduct, official DOJ ADA guidance, HHS/Section 1557/HIPAA guidance when applicable, state regulations where relevant, and W3C/WCAG for web accessibility. Distinguish law, professional recommendation, and MLS policy; do not describe a recommendation as a legal mandate.

**Publish only on a documented PASS:** Correct the article and its metadata first, verify references and claims, run checks and inspect the result, calculate the fingerprint with `blogContentFingerprint(post)` from `src/seo/blogReviewGate.js`, and add the matching record to `approvedBlogRevisions` in that file. The record format is `"article-slug": { publishDate: "YYYY-MM-DD", fingerprint: "8hexchars" }`. If the article changes again, recompute its fingerprint after another review. If uncertain or there are unresolved issues, do not add approval; report the blocker. The article will stay off the blog page and out of the dynamic sitemap until approved.

This safeguard affects only newer posts. All existing articles published through October 28, 2026 retain their current visibility. Do not use the older base `getPublishedBlogPosts` helper in public site features; use the guarded `blogPostsLive` helper. The Sunday task notification does **not** itself constitute approval—an explicit matching repository record is required.

Official starting points: https://rid.org/resources/ ; https://rid.org/programs/ethics/code-of-professional-conduct/ ; https://www.ada.gov/resources/effective-communication/ ; https://www.hhs.gov/civil-rights/for-individuals/section-1557/ ; https://www.w3.org/WAI/WCAG22/ .



## Current HTML publishing workflow

1. Save the article body in `src/content/blog/<slug>.html`. The page template renders the title and publication date, so omit duplicate title/date elements from the body.
2. Import the HTML with `?raw` in `src/content/blogPostsLive.js`, define the post metadata, and add the post to `allBlogPosts`.
3. Set `FEATURED_BLOG_SLUG` to the intended featured post. Home, blog index, and article pages use this live content module.
4. Add the matching slug, title, description, and date to `blogArticles` in `src/seo/siteMetadata.js`. The build uses this registry to generate article metadata pages and **overwrites** `dist/sitemap.xml`; editing `public/sitemap.xml` alone does not update the deployed sitemap.
5. Run `npm run check` and verify the built article page and sitemap before publishing.

Blog JSON-LD uses `BlogPosting`, Micah Stubbs as the Person author, and Miqueas Language Solutions LLC as publisher. Keep publication dates aligned with the visible date. Where a post has a visible FAQ, copy its exact questions and answers into `src/seo/blogFaqs.js`; metadata belongs in the document head, never in the article HTML. Verify exactly three visible questions and matching FAQ schema for new posts. Use professional ethical standards when referring to ethics, and EIPA 3.9 and 7+ years of experience for credentials.

The sections below describe the original base content module and supported article formats.

The MLS website now has a lightweight scheduled blog system built directly into the React/Vite site. No WordPress is required.

## Where blog posts live

Blog posts are stored in:

```txt
src/content/blogPosts.js
```

Each post has this structure:

```js
{
  slug: "sample-post-url",
  title: "Sample Blog Post Title",
  excerpt: "Short summary shown on the Blog page.",
  publishDate: "2026-06-22",
  category: "Client Guidance",
  readTime: "4 min read",
  featured: false,
  content: [
    {
      type: "paragraph",
      text: "Paragraph text goes here."
    },
    {
      type: "heading",
      text: "Section heading goes here."
    },
    {
      type: "list",
      items: [
        "First list item",
        "Second list item",
        "Third list item"
      ]
    }
  ]
}
```

## HTML blog posts

If a post is already written in HTML, use the `html` field instead of `content`:

```js
{
  slug: "sample-html-post",
  title: "Sample HTML Blog Post",
  excerpt: "Short summary shown on the Blog page.",
  publishDate: "2026-06-22",
  category: "Client Guidance",
  readTime: "6 min read",
  featured: true,
  html: String.raw`<p>Your HTML article content goes here.</p>`
}
```

The blog article page supports common HTML elements including paragraphs, images, links, headings, ordered lists, blockquotes, and horizontal rules.

## How scheduling works

The site only displays posts where:

```js
post.publishDate <= today
```

The date check uses the `America/New_York` timezone.

That means you can write several posts now and give them future dates. They will stay hidden until their publish date arrives.

## How to add a new scheduled post

1. Open `src/content/blogPosts.js`.
2. Copy one existing post object.
3. Paste it inside the `blogPosts` array.
4. Change the `slug`, `title`, `excerpt`, `publishDate`, `category`, `readTime`, and either `content` or `html`.
5. Commit the change.
6. When the publish date arrives, the post will appear automatically on `/blog`.

## URLs

- Blog index: `/blog`
- Blog post: `/blog/the-post-slug`

Example:

```txt
/blog/when-do-you-need-two-asl-interpreters
```

## Important notes

- Only one post should have `featured: true` at a time.
- Use lowercase slugs with hyphens.
- Keep titles clear and search-friendly.
- Good MLS blog topics include interpreter planning, Deaf access, VRI limitations, ASL translation, meeting preparation, and client education.
