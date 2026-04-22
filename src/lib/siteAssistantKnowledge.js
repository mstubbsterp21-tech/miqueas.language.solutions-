const CONTACT = {
  phoneDisplay: '(321) 379-8010',
  phoneHref: 'tel:+13213798010',
  emailDisplay: 'm.stubbs@miqueaslanguagesolutions.com',
  emailHref: 'mailto:m.stubbs@miqueaslanguagesolutions.com',
  contactPath: '/contact',
  interpreterRosterPath: '/resources/interpreters',
};

const SERVICES = [
  'in-person ASL-English interpreting',
  'video remote interpreting (VRI)',
  'English to ASL translation',
  'ASL to English translation',
];

const SPECIALTIES = ['medical', 'educational', 'business', 'community'];

const PAGE_LABELS = {
  '/': 'Home',
  '/services': 'Services',
  '/about': 'About',
  '/resources': 'Resources',
  '/resources/clients': 'Client Resources',
  '/resources/interpreters': 'Interpreter Resources',
  '/contact': 'Contact',
};

const PAGE_PROMPTS = {
  '/': [
    'What services do you offer?',
    'Do you provide remote interpreting?',
    'How do I request an interpreter?',
  ],
  '/services': [
    'What is the difference between in-person and VRI?',
    'Do you offer translation services too?',
    'How does pricing usually work?',
  ],
  '/about': [
    'What makes MLS different?',
    'What kinds of clients do you work with?',
    'Do you travel?',
  ],
  '/resources': [
    'Where should clients start?',
    'How can interpreters join your roster?',
    'What information do you need before booking?',
  ],
  '/resources/clients': [
    'How do clients submit a request?',
    'What details help speed up a quote?',
    'Can I book an info session first?',
  ],
  '/resources/interpreters': [
    'How can interpreters join the roster?',
    'What kinds of assignments does MLS handle?',
    'Who should contact you about subcontracting?',
  ],
  '/contact': [
    'I need an interpreter. What should I do first?',
    'Can I book an info session instead of filling out the form?',
    'What if my request is urgent?',
  ],
};

function normalizePath(pathname = '/') {
  if (!pathname) return '/';
  if (PAGE_LABELS[pathname]) return pathname;
  if (pathname.startsWith('/services/')) return '/services';
  if (pathname.startsWith('/resources/interpreters')) return '/resources/interpreters';
  if (pathname.startsWith('/resources/clients')) return '/resources/clients';
  if (pathname.startsWith('/resources')) return '/resources';
  return '/';
}

export function getPageLabel(pathname = '/') {
  return PAGE_LABELS[normalizePath(pathname)] || 'this page';
}

export function getStarterPrompts(pathname = '/') {
  return PAGE_PROMPTS[normalizePath(pathname)] || PAGE_PROMPTS['/'];
}

export function getContactActions(pathname = '/') {
  const normalized = normalizePath(pathname);

  if (normalized === '/resources/interpreters') {
    return [
      { type: 'link', label: 'Join the Roster', href: CONTACT.interpreterRosterPath },
      { type: 'external', label: 'Email MLS', href: CONTACT.emailHref },
    ];
  }

  return [
    { type: 'link', label: 'Request a Quote', href: CONTACT.contactPath },
    { type: 'external', label: CONTACT.phoneDisplay, href: CONTACT.phoneHref },
    { type: 'external', label: 'Email MLS', href: CONTACT.emailHref },
  ];
}

export function buildGreeting(pathname = '/') {
  const greetings = {
    '/': "Hey — I'm the MLS site assistant. I can answer questions about services, remote vs. in-person work, and how to request an interpreter.",
    '/services': "You're on the services page. I can help you compare in-person interpreting, VRI, and translation options.",
    '/about': "You're on the about page. I can explain what MLS does, who it's for, and what makes the service approach different.",
    '/resources': "You're in the resources section. I can point clients and interpreters to the right next step.",
    '/resources/clients': "You're in the client resources area. I can help you figure out what information to gather before submitting a request.",
    '/resources/interpreters': "You're in the interpreter resources area. I can answer basic questions about joining the roster or getting in touch.",
    '/contact': "You're on the contact page. I can help you decide whether to use the request form, book an info session, or call or email for urgent needs.",
  };

  const normalized = normalizePath(pathname);
  return greetings[normalized] || `You're on ${getPageLabel(pathname)}. I can help answer questions about MLS and point you to the right next step.`;
}

function baseAnswer(pathname) {
  return {
    reply: `${buildGreeting(pathname)} If you tell me what you need, I’ll point you in the right direction.`,
    actions: getContactActions(pathname),
    pageLabel: getPageLabel(pathname),
  };
}

function withActions(reply, pathname = '/') {
  return {
    reply,
    actions: getContactActions(pathname),
    pageLabel: getPageLabel(pathname),
  };
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

export function getFallbackResponse({ message = '', pathname = '/' } = {}) {
  const text = message.trim().toLowerCase();

  if (!text) {
    return baseAnswer(pathname);
  }

  if (includesAny(text, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
    return withActions(`${buildGreeting(pathname)} Ask me anything about services, booking, remote options, or how to contact MLS.`, pathname);
  }

  if (includesAny(text, ['service', 'offer', 'provide', 'what do you do'])) {
    const lastService = SERVICES[SERVICES.length - 1];
    const leadingServices = SERVICES.slice(0, SERVICES.length - 1).join(', ');

    return withActions(
      `MLS currently offers ${leadingServices}, and ${lastService}. The main sectors highlighted on the site are ${SPECIALTIES.join(', ')}. If you're not sure which service fits, the safest move is to start on the contact page so the assignment can be reviewed properly.`,
      pathname,
    );
  }

  if (includesAny(text, ['remote', 'vri', 'virtual', 'zoom', 'teams', 'telehealth'])) {
    return withActions(
      'Yes — MLS offers video remote interpreting (VRI) for remote meetings, telehealth, short-notice requests, and cross-location communication. Remote requests still need the same intake details so the assignment fit, timing, and platform logistics can be reviewed clearly.',
      pathname,
    );
  }

  if (includesAny(text, ['in person', 'on site', 'onsite', 'travel', 'come to', 'location'])) {
    return withActions(
      'Yes — MLS offers in-person interpreting and the site also states that travel is available. On-site requests should include the date, start time, end time, location, and any assignment details that affect placement or preparation.',
      pathname,
    );
  }

  if (includesAny(text, ['translation', 'translate', 'caption', 'transcript', 'asl video'])) {
    return withActions(
      'MLS also handles translation work in both directions: English to ASL for recorded accessible video content, and ASL to English for transcripts, captions, summaries, or documentation-ready output. Those are usually quoted after reviewing the source material and workflow needs.',
      pathname,
    );
  }

  if (includesAny(text, ['price', 'pricing', 'rate', 'cost', 'quote', 'how much'])) {
    return withActions(
      'The public pricing language on the site is structured by service type instead of giving one flat number in chat. In-person interpreting uses setting-based hourly rates with a 2-hour minimum, VRI uses hourly rates with a 1-hour minimum, and translation projects are quoted after source review. For an actual quote, MLS needs the assignment details through the request flow.',
      pathname,
    );
  }

  if (includesAny(text, ['book', 'booking', 'request', 'interpreter', 'need an interpreter', 'need services'])) {
    return withActions(
      'The main path is the request form on the contact page. If you already know the date, time, location or platform, and assignment details, submit the form directly. If you want help first, book an info session. If the request is urgent, call or email MLS directly.',
      pathname,
    );
  }

  if (includesAny(text, ['urgent', 'asap', 'right away', 'emergency'])) {
    return withActions(
      `For urgent requests, the site tells people to call ${CONTACT.phoneDisplay} or email ${CONTACT.emailDisplay} directly so MLS can respond faster than a standard intake flow.`,
      pathname,
    );
  }

  if (includesAny(text, ['contact', 'phone', 'email', 'reach you', 'reach micah'])) {
    return withActions(
      `You can reach MLS by phone at ${CONTACT.phoneDisplay} or by email at ${CONTACT.emailDisplay}. If the request is straightforward, the contact page form is still the best place to submit full assignment details.`,
      pathname,
    );
  }

  if (includesAny(text, ['info session', 'appointment', 'call first', 'talk first'])) {
    return withActions(
      'Yes — the contact page includes an info-session booking option for people who want to talk through the request before submitting the form. That is the better path when the client is unsure what type of service they need or what details to include.',
      pathname,
    );
  }

  if (includesAny(text, ['roster', 'interpreter roster', 'join', 'subcontract', 'work with you', 'become an interpreter'])) {
    return withActions(
      'MLS has a dedicated interpreter-resources path for roster-related interest. If you want to join the roster or ask about interpreter opportunities, the best move is to use the interpreter resources section or email MLS directly so the conversation stays separate from client booking intake.',
      '/resources/interpreters',
    );
  }

  if (includesAny(text, ['difference', 'compare', 'which service', 'which one'])) {
    return withActions(
      'Quick breakdown: in-person interpreting is best for live, on-site communication with room dynamics; VRI is best for remote real-time access; English to ASL translation is for recorded accessible ASL video; and ASL to English translation is for transcripts, captions, or written deliverables. If you tell me your scenario, I can point to the best starting option.',
      pathname,
    );
  }

  if (includesAny(text, ['deaf', 'hard of hearing', 'access', 'accommodation'])) {
    return withActions(
      'MLS positions its work around dependable communication access for Deaf and hard-of-hearing participants across medical, educational, business, and community settings. The request flow helps gather what is needed so the service can be matched to the actual communication situation instead of guessing.',
      pathname,
    );
  }

  return withActions(
    'I can help with questions about services, VRI versus in-person work, translation, booking, urgent requests, and how to contact MLS. Send your question in one sentence and I’ll narrow it down.',
    pathname,
  );
}
