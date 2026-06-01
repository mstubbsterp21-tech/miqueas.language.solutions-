export const blogPosts = [
  {
    slug: "when-do-you-need-two-asl-interpreters",
    title: "When Do You Need Two ASL Interpreters?",
    excerpt: "A practical guide for planning interpreted meetings, events, trainings, and appointments with the right amount of support.",
    publishDate: "2026-06-01",
    category: "Client Guidance",
    readTime: "4 min read",
    featured: true,
    content: [
      {
        type: "paragraph",
        text: "A common question clients ask is whether one interpreter is enough. Sometimes yes. But for longer, faster, higher-stakes, or more interactive assignments, two interpreters may be needed to protect accuracy, access, and interpreter effectiveness."
      },
      {
        type: "heading",
        text: "Two interpreters are often appropriate when the assignment is long or demanding."
      },
      {
        type: "paragraph",
        text: "Interpreting is active language work. The interpreter is listening or watching, processing meaning, making cultural and linguistic decisions, producing the message, monitoring accuracy, and adjusting in real time. That level of focus is not sustainable indefinitely without support."
      },
      {
        type: "list",
        items: [
          "Assignments longer than about one hour",
          "Meetings with dense technical, medical, legal, educational, or business vocabulary",
          "Large group events, trainings, panels, or platform presentations",
          "Situations where Deaf and hearing participants will interact frequently",
          "Assignments involving rapid turn-taking, emotional content, or complex decision-making"
        ]
      },
      {
        type: "heading",
        text: "The goal is not extra staffing. The goal is clear access."
      },
      {
        type: "paragraph",
        text: "A team allows one interpreter to actively interpret while the other monitors accuracy, tracks information, supports missed details, and prepares to switch. This helps reduce fatigue and improves the consistency of communication access throughout the assignment."
      },
      {
        type: "paragraph",
        text: "When MLS reviews a request, we look at the setting, length, topic, communication needs, and format before recommending one interpreter or a team. The cleanest setup is the one that supports the interaction without creating unnecessary friction."
      }
    ]
  },
  {
    slug: "why-vri-is-not-always-the-best-fit",
    title: "Why VRI Is Not Always the Best Fit",
    excerpt: "Video Remote Interpreting can be useful, but some situations need on-site support for full communication access.",
    publishDate: "2026-06-08",
    category: "Access Planning",
    readTime: "3 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "Video Remote Interpreting can be a strong option when the technology, setting, and communication needs line up. It can also create barriers when the environment is not ready for it."
      },
      {
        type: "heading",
        text: "VRI depends on more than having a screen."
      },
      {
        type: "list",
        items: [
          "Stable internet connection",
          "Clear audio for spoken language users",
          "Good lighting and camera placement",
          "A screen large enough for visual access",
          "Participants who know how to manage turn-taking"
        ]
      },
      {
        type: "paragraph",
        text: "If any of these pieces are missing, the interpreter may not be able to provide effective service. In those cases, on-site interpreting may be the more appropriate option."
      },
      {
        type: "heading",
        text: "MLS reviews the setting before recommending VRI."
      },
      {
        type: "paragraph",
        text: "Remote access should never be chosen just because it is convenient. It should be chosen because it actually supports the Deaf, hard-of-hearing, DeafBlind, and hearing participants involved."
      }
    ]
  },
  {
    slug: "how-to-prepare-for-an-interpreted-meeting",
    title: "How to Prepare for an Interpreted Meeting",
    excerpt: "Simple steps clients can take before an interpreted meeting to make the interaction smoother for everyone involved.",
    publishDate: "2026-06-15",
    category: "Client Guidance",
    readTime: "5 min read",
    featured: false,
    content: [
      {
        type: "paragraph",
        text: "A smooth interpreted meeting starts before everyone enters the room. The more context an interpreter has, the better they can prepare for names, vocabulary, goals, and communication dynamics."
      },
      {
        type: "heading",
        text: "Send materials ahead of time when possible."
      },
      {
        type: "list",
        items: [
          "Agenda or schedule",
          "Names and roles of participants",
          "Slides, handouts, scripts, or talking points",
          "Technical vocabulary or acronyms",
          "Any known communication preferences"
        ]
      },
      {
        type: "paragraph",
        text: "Preparation materials are not about giving the interpreter special access to private information. They are about giving the interpreter enough context to faithfully convey the message."
      },
      {
        type: "heading",
        text: "Build in space for natural communication."
      },
      {
        type: "paragraph",
        text: "Speak at a natural pace, allow one person to speak at a time, and remember that interpreted communication includes a slight processing delay. That small adjustment makes a major difference."
      }
    ]
  }
];

const todayInNewYork = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

export const getPublishedBlogPosts = () => {
  const today = todayInNewYork();
  return blogPosts
    .filter((post) => post.publishDate <= today)
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
};

export const getPublishedBlogPostBySlug = (slug) =>
  getPublishedBlogPosts().find((post) => post.slug === slug);

export const formatBlogDate = (dateString) =>
  new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
