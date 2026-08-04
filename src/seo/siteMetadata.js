export const SITE_URL = "https://miqueaslanguagesolutions.com";
export const DEFAULT_IMAGE = `${SITE_URL}/preview.png`;

const defaultDescription =
  "Miqueas Language Solutions provides professional ASL-English interpreting, video remote interpreting, and ASL video translation services for healthcare, education, business, and community settings in Florida and remotely.";

export const siteMetadata = {
  "/": {
    title: "ASL Interpreter Services in Florida | Miqueas Language Solutions",
    description: defaultDescription,
    priority: "1.0",
  },
  "/services": {
    title: "ASL Interpreting & Translation Services | MLS",
    description: "Explore in-person ASL interpreting, video remote interpreting, English-to-ASL translation, and ASL-to-English translation services for organizations and community settings.",
    schemaType: "Service",
    priority: "0.9",
  },
  "/services/in-person-interpreting": {
    title: "In-Person ASL Interpreting Services in Florida | MLS",
    description: "Book professional on-site ASL-English interpreting for healthcare, education, legal, business, community, conference, and live event settings across Florida.",
    schemaType: "Service",
    priority: "0.9",
  },
  "/services/video-remote-interpreting": {
    title: "Video Remote ASL Interpreting Services | MLS",
    description: "Professional VRI for telehealth, virtual meetings, remote appointments, and organizations that need clear visual communication access.",
    schemaType: "Service",
    priority: "0.9",
  },
  "/services/video-remote-interpreting-nationwide": {
    title: "Nationwide Video Remote ASL Interpreting | MLS",
    description: "Request professional nationwide video remote ASL-English interpreting for virtual meetings, telehealth, training, appointments, and remote services.",
    schemaType: "Service",
    priority: "0.9",
  },
  "/services/english-asl-translation": {
    title: "English to ASL Video Translation Services | MLS",
    description: "Turn English scripts, documents, policies, training materials, and public information into clear, natural ASL video content.",
    schemaType: "Service",
    priority: "0.8",
  },
  "/services/asl-english-translation": {
    title: "ASL to English Translation Services | MLS",
    description: "Convert ASL video into polished English transcripts, captions, summaries, and documentation-ready written content.",
    schemaType: "Service",
    priority: "0.8",
  },
  "/locations/orlando": {
    title: "ASL Interpreting Services in Orlando, FL | MLS",
    description: "Professional in-person ASL-English interpreting in Orlando for healthcare, business, education, conferences, appointments, and community events.",
    schemaType: "Service",
    areaServed: "Orlando, Florida",
    priority: "0.9",
  },
  "/locations/ocala": {
    title: "ASL Interpreting Services in Ocala, FL | MLS",
    description: "Professional in-person ASL-English interpreting in Ocala and Marion County for healthcare, education, business, legal, and community settings.",
    schemaType: "Service",
    areaServed: "Ocala, Florida",
    priority: "0.9",
  },
  "/locations/central-florida": {
    title: "ASL Interpreting Services in Central Florida | MLS",
    description: "Professional ASL-English interpreting across Central Florida, with preparation-focused support for healthcare, education, business, legal, and community settings.",
    schemaType: "Service",
    areaServed: "Central Florida",
    priority: "0.9",
  },
  "/about": {
    title: "About Miqueas Language Solutions | Professional ASL Access",
    description: "Learn about Miqueas Language Solutions, an ASL-English interpreting and translation company focused on clarity, preparation, and respectful communication access.",
    priority: "0.7",
  },
  "/blog": {
    title: "ASL Access Blog | Miqueas Language Solutions",
    description: "Practical guidance on ASL interpreting, VRI, healthcare access, DeafBlind access, emergency preparation, and communication accessibility.",
    priority: "0.8",
  },
  "/clients": {
    title: "Request ASL Interpreting Services | MLS Client Information",
    description: "Information for organizations requesting ASL-English interpreting, VRI, and ASL translation services through Miqueas Language Solutions.",
    priority: "0.8",
  },
  "/interpreters": {
    title: "ASL Interpreter Resources | Miqueas Language Solutions",
    description: "Resources and information for ASL interpreters, Certified Deaf Interpreters, and professionals interested in joining the MLS interpreter network.",
    priority: "0.7",
  },
  "/deaf-and-hard-of-hearing": {
    title: "Deaf & Hard of Hearing Access Resources | MLS",
    description: "Information for Deaf, DeafBlind, hard-of-hearing, and hearing consumers about communication access and professional interpreting services.",
    priority: "0.7",
  },
  "/join-our-team": {
    title: "Join the MLS ASL Interpreter Network | Apply Today",
    description: "Apply to join the Miqueas Language Solutions network of ASL-English interpreters and Certified Deaf Interpreters.",
    priority: "0.7",
  },
  "/contact": {
    title: "Request an ASL Interpreter | Miqueas Language Solutions",
    description: "Request professional ASL-English interpreting, VRI, or ASL translation services from Miqueas Language Solutions.",
    priority: "0.9",
  },
  "/policies/clients": { title: "Client Policies | Miqueas Language Solutions", description: "Review MLS client policies for scheduling, preparation, cancellation, billing, and communication access expectations.", priority: "0.4" },
  "/policies/consumers": { title: "Consumer Access Policies | Miqueas Language Solutions", description: "Review communication access policies for Deaf, DeafBlind, hard-of-hearing, and hearing consumers using MLS services.", priority: "0.4" },
  "/policies/interpreters": { title: "Interpreter Policies | Miqueas Language Solutions", description: "Review MLS interpreter policies for credentials, screenings, professionalism, assignment expectations, and ethical practice.", priority: "0.4" },
  "/privacy": { title: "Privacy Policy | Miqueas Language Solutions", description: "Read the Miqueas Language Solutions privacy policy.", priority: "0.2" },
  "/terms": { title: "Terms & Conditions | Miqueas Language Solutions", description: "Review the terms and conditions for using the Miqueas Language Solutions website and services.", priority: "0.2" },
  "/accessibility": { title: "Accessibility Statement | Miqueas Language Solutions", description: "Read the MLS website accessibility statement and learn how to request communication support.", priority: "0.3" },
  "/interpreter-community": { title: "ASL Interpreter Community | Miqueas Language Solutions", description: "Connect with the MLS interpreter community and learn about professional collaboration, support, and ethical interpreting practice.", priority: "0.5" },
};

const blogArticles = [
  ["cost-communication-breakdown-cheap-interpreting", "The Cost of Communication Breakdown: Why Cheap Interpreting Costs More", "Why interpreter value should be measured by readiness, fit, reliability, and risk—not just the lowest hourly rate.", "2026-07-27"],
  ["asl-access-workplace-employer-accommodations", "ASL Access in the Workplace: An Employer Accommodation Guide", "A practical guide for employers and HR teams planning ASL access for interviews, onboarding, meetings, training, and everyday workplace communication.", "2026-07-20"],
  ["how-to-hire-qualified-asl-interpreter-florida", "How to Hire a Qualified ASL Interpreter in Florida", "A practical credential-review guide for Florida organizations evaluating interpreter qualifications, assignment fit, preparation, and professional readiness.", "2026-07-13"],
  ["7-mistakes-sign-language-services-healthcare", "7 Healthcare Sign Language Service Mistakes", "Seven common healthcare communication-access mistakes—and practical ways to improve ASL interpreting quality, safety, and patient experience.", "2026-07-06"],
  ["summer-school-accessibility-professional-asl-support", "Summer Accessibility Planning with Professional ASL Support", "Why summer is the right time for organizations to review accessibility plans, ASL support, and professional communication access standards.", "2026-06-25"],
  ["celebrating-black-deaf-excellence-juneteenth-2026-florida", "Celebrating Black Deaf Excellence in Florida", "A reflection on Black Deaf Excellence, Juneteenth celebrations in Florida, and why professional ASL communication access matters at cultural events.", "2026-06-22"],
  ["asl-healthcare-community-hands-up-conference-2026-orlando", "ASL, Healthcare & the Hands Up Conference 2026 in Orlando", "A practical look at communication access, healthcare readiness, and professional ASL interpreting around the Hands Up Conference 2026 in Orlando.", "2026-06-15"],
  ["why-vri-is-not-always-the-best-fit", "Why VRI Is Not Always the Answer", "Video Remote Interpreting can be useful, but some situations need on-site support, better setup, or a different access plan.", "2026-06-08"],
  ["asl-access-florida-hurricane-prep-guide", "ASL Access: 2026 Florida Hurricane Preparation Guide", "A practical emergency-readiness guide for organizations planning ASL access during Florida hurricane season.", "2026-06-02"],
  ["ai-vs-human-asl-interpreters", "AI vs. Human ASL Interpreters", "Why AI tools cannot replace qualified human ASL interpreters in high-stakes communication access settings.", "2026-06-02"],
  ["deafblind-asl-interpreting-effective-access", "DeafBlind ASL Interpreting and Effective Access", "A practical guide to DeafBlind interpreting access, tactile communication, environmental information, and readiness.", "2026-06-02"],
  ["vri-vs-in-person-asl-interpreting-healthcare", "VRI vs. In-Person ASL Interpreting in Healthcare", "A practical healthcare access guide for choosing between Video Remote Interpreting and in-person ASL interpreting.", "2026-06-01"],
];

for (const [slug, title, description, publishDate] of blogArticles) {
  siteMetadata[`/blog/${slug}`] = {
    title: `${title} | MLS`, description, publishDate, schemaType: "Article", priority: "0.8",
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: "Miqueas Language Solutions",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo.png`,
  image: DEFAULT_IMAGE,
  telephone: "+1-321-379-8010",
  email: "m.stubbs@miqueaslanguagesolutions.com",
  areaServed: ["Florida", "United States"],
  sameAs: [
    "https://www.instagram.com/miqueas.language.solutions/",
    "https://www.facebook.com/profile.php?id=61573286078153",
    "https://www.linkedin.com/company/miqueas-language-solutions/",
  ],
};

export function schemaForRoute(path, meta) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: path === "/" ? [] : [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: meta.title.split("|")[0].trim(), item: url },
    ],
  };
  if (meta.schemaType === "Service") {
    return [organizationSchema, breadcrumb, {
      "@context": "https://schema.org",
      "@type": "Service",
      name: meta.title.split("|")[0].trim(),
      description: meta.description,
      url,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: meta.areaServed || ["Florida", "United States"],
      serviceType: "ASL-English interpreting and translation",
    }];
  }
  if (meta.schemaType === "Article") {
    return [organizationSchema, breadcrumb, {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: meta.title.split("|")[0].trim(),
      description: meta.description,
      datePublished: meta.publishDate,
      dateModified: meta.publishDate,
      mainEntityOfPage: url,
      image: DEFAULT_IMAGE,
      author: { "@type": "Organization", name: "Miqueas Language Solutions" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    }];
  }
  return path === "/" ? [organizationSchema] : [organizationSchema, breadcrumb];
}
