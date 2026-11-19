import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

// This is the no-JavaScript version of the public marketing site, not a bot-only
// page. React replaces it with the interactive equivalent when it mounts.
// Its text and links are usable by visitors whose browsers do not run JS.
const serviceLinks = [
  ["/services/in-person-interpreting", "In-person ASL interpreting"],
  ["/services/video-remote-interpreting", "Video remote interpreting"],
  ["/services/english-asl-translation", "English to ASL video translation"],
  ["/services/asl-english-translation", "ASL to English translation"],
];
const areaLinks = [
  ["/locations/orlando", "Orlando"],
  ["/locations/ocala", "Ocala and Marion County"],
  ["/locations/central-florida", "Central Florida"],
  ["/services/video-remote-interpreting-nationwide", "Nationwide remote interpreting"],
];
const globalLinks = [
  ["/", "Home"], ["/services", "Services"], ["/about", "About MLS"],
  ["/blog", "Communication access blog"], ["/contact", "Request services"],
];

const specificCopy = {
  "/": [
    "Miqueas Language Solutions coordinates professional ASL-English interpreting and ASL video translation. Services include on-site interpreting for live settings, video remote interpreting for suitable online encounters, English-to-ASL video translation, and ASL-to-English translation.",
    "MLS works with healthcare, education, business, and community organizations. Each service request is reviewed for setting, participant needs, timing, preparation materials, and appropriate interpreter fit before confirming next steps.",
  ],
  "/services": [
    "Choose between live on-site interpreting, video remote interpreting, and recorded ASL translation. Different settings require different planning, technology, preparation, and service approaches.",
    "MLS coordinates local Florida assignments and remote interpreting throughout the United States, subject to interpreter availability and whether the communication needs can be effectively met through the requested modality.",
  ],
  "/services/in-person-interpreting": [
    "In-person ASL-English interpreting can support medical appointments, school meetings, legal consultations, workplace discussions, conferences, and community events where the interpreter's physical presence is important.",
    "MLS reviews participants, location, preparation needs, required qualifications, visibility, travel, and possible team interpreting before confirming on-site coverage.",
  ],
  "/services/video-remote-interpreting": [
    "Video Remote Interpreting, or VRI, connects participants and a qualified ASL-English interpreter through live video. It may suit telehealth, virtual meetings, distributed teams, and other remote conversations.",
    "Effective VRI requires a reliable connection, clear audio, adequate video quality, appropriate framing, and a communication environment that supports signed language. An in-person interpreter may be more appropriate for some encounters.",
  ],
  "/services/video-remote-interpreting-nationwide": [
    "MLS provides video remote ASL-English interpreting for virtual appointments, telehealth, team meetings, training, and other appropriate encounters throughout the United States.",
    "Each request is reviewed for interpreter availability, platform accessibility, participant needs, time zone, and preparation before confirming service.",
  ],
  "/services/english-asl-translation": [
    "English-to-ASL translation transforms scripts, documents, policies, educational information, and training materials into recorded American Sign Language video content.",
    "MLS reviews audience, terminology, source material, recording format, and any agreed revision steps so the final ASL communication is natural and appropriate for its purpose.",
  ],
  "/services/asl-english-translation": [
    "ASL-to-English translation converts signed video into English text, captions, summaries, transcripts, or other agreed written formats.",
    "A project begins with a review of the source material, intended audience, required terminology, confidentiality, format, and scope of quality review.",
  ],
  "/locations/orlando": [
    "MLS supports Orlando organizations arranging ASL-English interpreting for scheduled healthcare encounters, business meetings, training, education, conferences, and community events.",
    "Interpreting requests are reviewed for assignment fit, credentials, logistics, preparation, and availability in Orlando and nearby Central Florida communities.",
  ],
  "/locations/ocala": [
    "MLS provides ASL-English interpreting coordination for organizations in Ocala, Marion County, and surrounding Florida communities.",
    "Services may support appointments, consultations, workplace meetings, school activities, and planned community access, depending on interpreter availability and assignment requirements.",
  ],
  "/locations/central-florida": [
    "MLS coordinates professional ASL-English interpreting across Central Florida, including Orlando and Ocala-area requests.",
    "Coverage for healthcare, educational, business, legal, and community settings is reviewed based on availability, required credentials, location, and the communication needs of everyone involved.",
  ],
  "/about": [
    "Miqueas Language Solutions is an ASL-English interpreting and translation provider focused on preparation, thoughtful coordination, professional judgment, and meaningful communication access.",
  ],
  "/contact": [
    "Organizations can request ASL-English interpreting or video translation by sharing the setting, requested date and time, location or platform, expected duration, and relevant preparation information. MLS reviews the request and follows up with availability and next steps.",
  ],
};


const supplementalCopy = {
  "/": [
    "Planning communication access starts before the meeting or appointment. Details such as the subject matter, communication preferences, schedule, setting, and whether a team or Deaf Interpreter is appropriate all inform the assignment review. MLS works with requesters to clarify these details rather than treating every interpreting request as interchangeable.",
    "Organizations can explore service-specific information for in-person assignments, video remote interpreting, and recorded ASL translation. The site also provides service-area information, public policy guides, and articles about preparing effective access for Deaf, DeafBlind, and hard-of-hearing participants."
  ],
  "/services": [
    "Choosing the right service depends on whether communication is happening live or through pre-recorded materials. On-site interpreting supports shared physical environments, while VRI requires accessible technology and an encounter appropriate for remote delivery. Translation projects instead involve source materials, recording or transcription, review, and an agreed deliverable.",
    "Requesters should share the purpose of the communication, participant preferences, duration, language needs, and relevant materials. For complex or high-stakes settings, MLS may review whether specialized skills, team interpreting, or Deaf Interpreter involvement are needed before accepting an assignment."
  ],
  "/about": [
    "MLS approaches interpreting as more than assigning a person to a time slot. Effective service requires attention to setting, language, preparation, technology, and the choices of the people participating in the communication. An assignment is reviewed for a suitable interpreter fit before coverage is confirmed.",
    "The company coordinates both live ASL-English interpreting and translation projects involving ASL video or written English. Services are organized around access needs in healthcare, education, workplaces, and the community, including remote encounters when the format supports effective communication.",
    "To learn how that planning works in practice, review the service descriptions and client information before submitting a request. Interpreters interested in professional collaboration can also explore the interpreter resources and application pages."
  ],
  "/join-our-team": [
    "MLS welcomes inquiries from professional ASL-English interpreters and Deaf Interpreters who are interested in contract opportunities. Applicants should be prepared to share relevant experience, settings of practice, qualifications, and geographic or remote-service availability.",
    "Interpreter placement depends on each assignment's requirements rather than a one-size-fits-all roster. Credentials, language competencies, preparation, professional conduct, consumer preferences, and specialized experience may be considered before a potential assignment is offered.",
    "Joining an interpreter network does not guarantee assignments. The interpreter resources page provides additional context, and applicants can use the team application process to begin a conversation about whether the work is a good professional fit."
  ],
  "/clients": [
    "When requesting an interpreter, specify the date, time zone, expected duration, in-person location or online platform, and the purpose of the interaction. Include relevant communication preferences and any need for specialized qualifications, team interpreting, or Deaf Interpreter support.",
    "Preparation can include agendas, slides, vocabulary, participant roles, and instructions about sight lines, lighting, and sound. For video remote services, the platform, camera setup, and reliability of the connection matter as much as scheduling.",
    "Submitting a request begins an assignment review; it is not a guarantee of staffing. The service pages and public client policies explain more about coordination, expectations, and the steps toward confirmation."
  ],
  "/interpreters": [
    "Interpreter work calls for linguistic skill, ethical judgment, cultural responsiveness, and the ability to assess whether an assignment is within one's competencies. MLS considers professional preparation, service format, setting, and consumer needs when coordinating assignments.",
    "Interpreters can explore professional collaboration and potential contract opportunities through the MLS network. Information about qualifications, experience, availability, and relevant specialties helps determine whether an assignment is a suitable match.",
    "Review the interpreter community, team application, and interpreter policy pages for more about professional expectations and how to express interest in the network."
  ],
  "/deaf-and-hard-of-hearing": [
    "Communication access should reflect the preferences and actual language needs of the people participating. Deaf, DeafBlind, and hard-of-hearing individuals may use different signed, spoken, tactile, or other communication approaches, and a single service format will not fit every interaction.",
    "Consumers may have preferences regarding interpreter qualifications, language variety, interpreter teaming, placement, and whether remote video works for their situation. Those preferences are important information when services are planned.",
    "This site provides descriptions of interpreting and translation services, a way to contact MLS, and information about communication access expectations. Individuals can share access concerns or questions before an assignment is finalized."
  ],
  "/settings/medical": [
    "Medical encounters can involve complex terminology, informed decisions, sensitive information, and rapid changes in the conversation. Planning should consider the type of appointment, expected participants, patient communication preferences, and whether on-site interpreting or accessible video remote interpreting is appropriate.",
    "For VRI, the team should check video quality, audio, lighting, camera position, and whether the patient can comfortably see and engage with the interpreter. Some situations require on-site support, specialized skills, or a Deaf Interpreter.",
    "Requesting staff can provide appointment details and relevant terminology in advance, while keeping confidential information limited to what is necessary for effective service planning."
  ],
  "/settings/educational": [
    "Educational communication access can include classroom instruction, parent and teacher conferences, planning meetings, staff development, and school activities. These contexts differ in pace, terminology, interaction patterns, and the support needed for effective participation.",
    "Before requesting coverage, schools can describe the students or participants involved, communication preferences, the duration and format of the activity, and any relevant educational interpreting requirements. Preparation materials and the opportunity to coordinate with the educational team may be important.",
    "MLS reviews assignment requirements and interpreter qualifications rather than assuming that experience in one setting automatically transfers to every educational encounter."
  ],
  "/settings/business": [
    "Workplace communication access may be needed for job interviews, onboarding, team meetings, disciplinary discussions, trainings, presentations, and everyday collaboration. Each setting has different confidentiality, vocabulary, and participation requirements.",
    "Organizations should plan interpreting access early, clarify whether events are on-site or virtual, and share agendas or presentation materials when available. For longer, high-density, or multi-speaker events, interpreter team support may be appropriate.",
    "MLS reviews workplace assignment details to determine whether available interpreting resources are suitable for the participants and format."
  ],
  "/settings/community": [
    "Community interpreting may support social services, public programs, nonprofit events, local meetings, workshops, and other occasions where people need to participate in shared conversations. Clear access planning should account for the environment, number of participants, and nature of the interaction.",
    "Organizers can prepare by identifying sight lines, lighting, microphones, speaker positions, schedules, and materials that interpreters will need. Consumer preferences and any requests for specialized language access should be shared before confirming coverage.",
    "MLS can review on-site and suitable remote options based on available qualified interpreters and the setting's communication demands."
  ],
  "/services/english-asl-translation": [
    "A translation request can begin with public information, policy documents, training scripts, educational materials, or another approved English source. The project review considers the intended Deaf audience, purpose, clarity of the source text, specialized terminology, and preferred video format.",
    "English-to-ASL translation is not simply replacing one word with one sign. Decisions about organization, visual delivery, cultural and linguistic equivalence, and revisions help create understandable signed content. Final scope and production expectations should be agreed on before work begins."
  ],
  "/services/asl-english-translation": [
    "ASL-to-English translation involves interpreting the meaning of recorded signed material and producing an agreed English deliverable. This might be a transcript, summary, caption-ready text, or a document prepared for a defined audience and purpose.",
    "Project details should identify the source video's length, language variety, any specialist vocabulary, confidentiality requirements, output format, and review expectations. Complex material may require additional consultation or careful terminology verification."
  ],
  "/services/in-person-interpreting": [
    "Useful assignment details include the venue, expected duration, number and roles of participants, topic, anticipated pace, and information about sight lines and acoustics. The location should support safe and effective communication for everyone involved.",
    "Long meetings, specialized settings, or dense interactive discussions may require more than one interpreter or the involvement of a Deaf Interpreter. MLS considers these factors and consumer preferences when evaluating staffing rather than treating every hour of interpreting as identical."
  ],
  "/services/video-remote-interpreting": [
    "Remote interpreting is not automatically appropriate just because a video platform is available. Participants need a clear view of signing, functional audio for the interpreter, adequate lighting, privacy, and enough bandwidth for continuous visual communication.",
    "When participants cannot use the technology effectively, or when the setting calls for tactile communication or other specialized access, on-site arrangements may be more suitable. MLS evaluates the communication circumstances and platform before confirming VRI."
  ],
  "/services/video-remote-interpreting-nationwide": [
    "Nationwide requests should identify each participant's location and time zone, the online platform, the type of encounter, expected length, and any accessibility requirements. Virtual availability still depends on interpreter skills and whether remote delivery fits the situation.",
    "Preparation materials and a technical contact can help a remote session begin smoothly. If the platform does not provide stable audio and video, or if remote delivery would prevent effective participation, an alternative approach may be needed."
  ],
  "/locations/orlando": [
    "Orlando requests can involve healthcare facilities, educational institutions, corporate meetings, conferences, and community programs. Organizations should send the specific venue, schedule, accessibility requirements, and preparation information so the interpreting assignment can be evaluated.",
    "Coverage in Orlando and nearby communities depends on availability and appropriate qualifications. MLS may recommend team interpreting or specialized support based on complexity and duration."
  ],
  "/locations/ocala": [
    "Organizations in Ocala and Marion County may need interpreting for appointments, school meetings, public services, trainings, and community activities. Early requests help clarify location, duration, language preferences, and the qualifications relevant to the situation.",
    "MLS coordinates service according to interpreter availability and the practical needs of each encounter, including preparation and the possibility of additional interpreter support."
  ],
  "/locations/central-florida": [
    "Central Florida assignments can differ significantly between healthcare, school, workplace, and community settings. Requesters should identify the precise city and venue, the expected schedule, and whether a specialized interpreting background is necessary.",
    "Service coverage is reviewed case by case, including travel logistics, consumer preferences, preparation, and the availability of appropriately qualified interpreters."
  ],
  "/blog": [
    "The MLS communication access blog offers educational articles for organizations, interpreters, and community members. Topics include video remote interpreting, DeafBlind communication, healthcare and workplace access, emergency planning, and preparation for interpreted interactions.",
    "Browse the published articles below for practical considerations, common access barriers, and questions to raise when arranging interpreting services. Articles provide general information rather than replacing an individual assessment of communication needs."
  ],
  "/interpreter-community": [
    "Professional collaboration includes sharing resources, discussing work thoughtfully, reflecting on ethical practice, and staying engaged in ongoing learning. An effective interpreter community also respects the experiences and perspectives of Deaf consumers and colleagues.",
    "Explore MLS interpreter resources, the team application page, and current communication access articles for opportunities to learn and connect."
  ],
  "/contact": [
    "Requests are easier to evaluate when they include the setting, requested dates and times, participants' communication preferences, location or virtual platform, and materials that might require advance preparation.",
    "If the details are still being determined, explain what is known and what remains undecided. MLS can review the request and communicate next steps without assuming that submitting an inquiry guarantees an interpreter."
  ]
};

const settingLinks = [
  ["/settings/medical", "Medical and healthcare interpreting"],
  ["/settings/educational", "Educational interpreting"],
  ["/settings/business", "Workplace and business interpreting"],
  ["/settings/community", "Community interpreting"],
];
const audienceLinks = [
  ["/clients", "Information for organizations"],
  ["/deaf-and-hard-of-hearing", "Information for Deaf and hard-of-hearing consumers"],
  ["/interpreters", "Interpreter resources"],
  ["/join-our-team", "Join the interpreter network"],
];


const resourceDepthCopy = {
  "/clients": [
    "For reliable planning, designate a contact person who can answer questions about the event or appointment and communicate any schedule changes. Requests involving multiple participants, specialized subject matter, or a long duration may need extra coordination before the right staffing plan can be confirmed."
  ],
  "/contact": [
    "If an event includes multiple speakers, a presentation, sensitive subject matter, or a request for a Deaf Interpreter, include that detail in the initial message. It can help MLS identify possible preparation and staffing needs and avoid preventable follow-up delays."
  ],
  "/deaf-and-hard-of-hearing": [
    "A consumer's ability to participate independently matters throughout an interpreted interaction, not only at the initial request. Preferences may change depending on the subject, environment, technology, or available language options, so requesting organizations should be ready to revisit their access plan when needed."
  ],
  "/interpreter-community": [
    "Mentoring, skills development, and collegial consultation can support professional growth, provided that consumer confidentiality and professional boundaries are maintained. Interpreters can benefit from reflecting on assignment fit, language choices, ethical decisions, and the impact of their work on communication access.",
    "The broader interpreting profession also depends on continued engagement with Deaf communities and recognition that accessibility planning should center the communication needs and preferences of the people being served."
  ],
  "/interpreters": [
    "Assignment preparation may include reviewing terminology, clarifying the purpose of an interaction, coordinating with a team interpreter, and assessing whether the physical or virtual environment supports effective service. Maintaining appropriate boundaries and confidentiality is essential across service formats."
  ],
  "/join-our-team": [
    "Applicants can strengthen their introduction by describing the kinds of assignments they are equipped to accept, areas they are actively developing, and the accommodations or working conditions they may need to perform effectively. Honest self-assessment supports appropriate staffing and protects consumers."
  ],
  "/settings/medical": [
    "Healthcare teams should consider access throughout check-in, consent, consultations, instructions, and follow-up rather than assuming interpreting is needed only during the central medical conversation. Clear communication at every stage can affect how well participants understand and act on information."
  ],
  "/settings/educational": [
    "Educational interpreting needs can change across academic subjects, student age groups, meetings, and extracurricular activities. A thoughtful request identifies the specific setting and how the interpreter will interact with students, staff, and family members."
  ],
  "/settings/business": [
    "Communication planning should also address unscheduled questions and interactive portions of the workday, not solely formal presentations. A recurring meeting may require different preparation from a confidential human-resources conversation or a multi-day conference."
  ],
  "/settings/community": [
    "For events open to the public, organizers should make access information easy to find and offer a clear way to communicate individual requirements. Accessible announcements and realistic lead times can help participants make informed decisions about attending."
  ]
};

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function links(items) {
  return "<ul>" + items.map(([url, label]) =>
    '<li><a href="' + escapeHtml(url) + '">' + escapeHtml(label) + "</a></li>"
  ).join("") + "</ul>";
}

function extraContent(path) {
  const paragraphs = [...(specificCopy[path] || []), ...(supplementalCopy[path] || []), ...(resourceDepthCopy[path] || [])];
  return paragraphs.map((text) => "<p>" + escapeHtml(text) + "</p>").join("");
}

function safeArticleHtml(value) {
  // The blog HTML is authored in this repository. Omit executable and
  // media elements in the lightweight HTML fallback; keep headings and text.
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<h1\b([^>]*)>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");
}

async function blogBody(slug) {
  const htmlPath = join(cwd(), "src", "content", "blog", slug + ".html");
  try {
    return safeArticleHtml(await readFile(htmlPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  // Early articles were stored as inline String.raw HTML in blogPosts.js.
  // Keep these accessible without duplicating their content in a second file.
  const source = await readFile(join(cwd(), "src", "content", "blogPosts.js"), "utf8");
  const token = 'slug: "' + slug + '"';
  const from = source.indexOf(token);
  if (from < 0) return "";
  const nextPost = source.indexOf('\n  {\n    slug:', from + token.length);
  const post = source.slice(from, nextPost < 0 ? undefined : nextPost);
  const tick = String.fromCharCode(96);
  const marker = "html: String.raw" + tick;
  const offset = post.indexOf(marker);
  if (offset < 0) return "";
  const begin = offset + marker.length;
  const end = post.indexOf(tick, begin);
  return end < 0 ? "" : safeArticleHtml(post.slice(begin, end));
}

function articleDirectory(published, limit = 100) {
  const posts = published
    .filter(([path]) => path.startsWith("/blog/"))
    .sort((a, b) => (b[1].publishDate || "").localeCompare(a[1].publishDate || ""))
    .slice(0, limit);
  if (!posts.length) return "";
  const entries = posts.map(([url, article]) =>
    '<li><a href="' + escapeHtml(url) + '">' + escapeHtml(article.title.split("|")[0].trim()) + '</a>'
    + (article.description ? '<p>' + escapeHtml(article.description) + '</p>' : "") + "</li>"
  ).join("");
  return '<section><h2>' + (limit < 100 ? "Latest communication access articles" : "Published articles") + '</h2><ul>' + entries + '</ul></section>';
}

export async function staticFallbackForRoute(path, meta, published = []) {
  const title = meta.title.split("|")[0].trim();
  const description = meta.description || "";
  const isArticle = path.startsWith("/blog/");
  const article = isArticle ? await blogBody(path.slice("/blog/".length)) : "";
  const more = extraContent(path);
  const sections = isArticle
    ? '<article><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p>' + article + '</article>'
    : '<article><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p>' + more + '</article>';

  const servicesSection = (path === "/" || path === "/services" || path.startsWith("/locations/"))
    ? '<section><h2>ASL interpreting and translation services</h2>' + links(serviceLinks) + '</section>'
    : "";
  const areaSection = (path === "/" || path === "/services")
    ? '<section><h2>Service areas</h2>' + links(areaLinks) + '</section>'
    : "";
  const settingsSection = (path === "/" || path === "/services" || path.startsWith("/services/"))
    ? '<section><h2>Interpreting by setting</h2>' + links(settingLinks) + "</section>" : "";
  const audiencesSection = (path === "/" || path === "/about" || path === "/services" || path === "/blog")
    ? '<section><h2>Resources and next steps</h2>' + links(audienceLinks) + "</section>" : "";
  const articlesSection = path === "/blog" ? articleDirectory(published) : path === "/" ? articleDirectory(published, 5) : "";
  const requestSection = path === "/contact"
    ? '<p>To request services, email <a href="mailto:m.stubbs@miqueaslanguagesolutions.com">m.stubbs@miqueaslanguagesolutions.com</a> or call <a href="tel:+13213798010">(321) 379-8010</a>.</p>'
    : '<p><a href="/contact">Request an interpreter or discuss a translation project</a></p>';

  return '<div class="mls-static-content" data-mls-seo-fallback="true">'
    + '<header><a href="/">Miqueas Language Solutions</a><nav aria-label="Main navigation">' + links(globalLinks) + '</nav></header>'
    + '<main>' + sections + servicesSection + areaSection + settingsSection + audiencesSection + articlesSection + requestSection + '</main>'
    + '<footer>Bridging Perspectives. Delivering Understanding.</footer></div>';
}

export const fallbackStyles =
  "<style id=\"mls-seo-fallback-css\">"
  + ".mls-static-content{font:16px/1.65 system-ui,sans-serif;max-width:960px;padding:2rem;margin:auto;color:#202020;background:#fff}"
  + ".mls-static-content header,.mls-static-content section{margin-bottom:1.5rem}"
  + ".mls-static-content h1{font-size:2rem;line-height:1.2}"
  + ".mls-static-content h2{font-size:1.4rem;line-height:1.3;margin-top:1.5rem}"
  + ".mls-static-content a{color:#721100;text-decoration:underline}"
  + ".mls-static-content ul{padding-left:1.5rem}"
  + ".mls-static-content footer{margin-top:2rem}"
  + "</style>";
