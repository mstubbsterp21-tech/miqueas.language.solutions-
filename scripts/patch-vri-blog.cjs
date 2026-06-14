const fs = require('fs');

const blogPath = 'src/content/blogPosts.js';
if (!fs.existsSync(blogPath)) process.exit(0);

let blog = fs.readFileSync(blogPath, 'utf8');

if (!blog.includes('whyVriBestFitHtml')) {
  blog = blog.replace(
    'import deafblindAccessHtml from "./blog/deafblind-asl-interpreting-effective-access.html?raw";\n',
    'import deafblindAccessHtml from "./blog/deafblind-asl-interpreting-effective-access.html?raw";\nimport whyVriBestFitHtml from "./blog/why-vri-is-not-always-the-best-fit.html?raw";\nimport whyVriBestFitPart2Html from "./blog/why-vri-is-not-always-the-best-fit-part2.html?raw";\nimport whyVriBestFitPart3Html from "./blog/why-vri-is-not-always-the-best-fit-part3.html?raw";\nimport whyVriBestFitPart4Html from "./blog/why-vri-is-not-always-the-best-fit-part4.html?raw";\n'
  );
}

const updatedPost = `{
    slug: "why-vri-is-not-always-the-best-fit",
    title: "Why VRI Isn’t Always the Answer: Choosing the Right Access for Every Setting",
    excerpt: "Video Remote Interpreting can be useful, but some situations need on-site support, better setup, or a different access plan.",
    publishDate: "2026-06-08",
    category: "Access Planning",
    readTime: "9 min read",
    featured: false,
    html: [whyVriBestFitHtml, whyVriBestFitPart2Html, whyVriBestFitPart3Html, whyVriBestFitPart4Html].join("\n")
  }`;

blog = blog.replace(/\{\n\s*slug: "why-vri-is-not-always-the-best-fit",[\s\S]*?\n\s*\},\n\s*\{\n\s*slug: "how-to-prepare-for-an-interpreted-meeting"/, updatedPost + ',\n  {\n    slug: "how-to-prepare-for-an-interpreted-meeting"');

fs.writeFileSync(blogPath, blog);
