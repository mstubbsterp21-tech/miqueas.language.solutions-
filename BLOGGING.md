# MLS Blog Publishing Guide

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
