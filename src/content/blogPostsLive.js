import { blogPosts as baseBlogPosts, formatBlogDate } from "./blogPosts";
import whyVriBestFitHtml from "./blog/why-vri-is-not-always-the-best-fit.html?raw";
import whyVriBestFitPart2Html from "./blog/why-vri-is-not-always-the-best-fit-part2.html?raw";
import whyVriBestFitPart3Html from "./blog/why-vri-is-not-always-the-best-fit-part3.html?raw";
import whyVriBestFitPart4Html from "./blog/why-vri-is-not-always-the-best-fit-part4.html?raw";

const updatedVriPost = {
  slug: "why-vri-is-not-always-the-best-fit",
  title: "Why VRI Isn’t Always the Answer: Choosing the Right Access for Every Setting",
  excerpt: "Video Remote Interpreting can be useful, but some situations need on-site support, better setup, or a different access plan.",
  publishDate: "2026-06-08",
  category: "Access Planning",
  readTime: "9 min read",
  featured: false,
  html: [whyVriBestFitHtml, whyVriBestFitPart2Html, whyVriBestFitPart3Html, whyVriBestFitPart4Html].join("\n"),
};

export const blogPosts = baseBlogPosts.map((post) =>
  post.slug === updatedVriPost.slug ? updatedVriPost : post
);

const todayInNewYork = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

export const getPublishedBlogPosts = () => {
  const today = todayInNewYork();
  return blogPosts
    .filter((post) => post.publishDate <= today)
    .sort((a, b) => {
      const dateSort = b.publishDate.localeCompare(a.publishDate);
      if (dateSort !== 0) return dateSort;
      return Number(b.featured) - Number(a.featured);
    });
};

export const getPublishedBlogPostBySlug = (slug) =>
  getPublishedBlogPosts().find((post) => post.slug === slug);

export { formatBlogDate };
