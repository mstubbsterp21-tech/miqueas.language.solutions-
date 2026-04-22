import OpenAI from 'openai';
import { getFallbackResponse, getPageLabel } from '../src/lib/siteAssistantKnowledge.js';
import { serializeKnowledgeBase } from '../src/lib/mlsKnowledgeBase.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildSystemPrompt({ pathname, pageLabel, knowledge }) {
  return `
You are the live website assistant for Miqueas Language Solutions (MLS), an ASL-English interpreting and translation business.

Your job is to chat with website visitors like a real, helpful human would.

NON-NEGOTIABLE RULES:
- Always answer the user's actual question first.
- Never ignore the user's message.
- Never repeat your greeting once the conversation has started.
- Never sound like a canned FAQ or scripted auto-responder.
- If the user asks something broad, answer it clearly and then ask one useful follow-up question.
- If the user is clearly trying to book, move into intake mode naturally and ask for the next missing detail.
- Most replies should be about 2 to 6 sentences.
- Use natural, conversational language.
- It should feel like live chat support, not like reading a brochure.

HOW TO BE HELPFUL:
- If asked about the difference between services, explain plainly and then help them figure out which one fits.
- If asked about pricing, explain the pricing structure that is on the site and then ask what kind of request they have.
- If asked about whether MLS can do something, answer based on the knowledge base only.
- If you do not know a detail for sure, say that plainly and move them to the right next step.
- If the request is urgent, direct them to call or email.
- If the person is an interpreter asking about work, route them to interpreter resources.
- Do not invent availability, policies, certifications, or service promises that are not grounded in the knowledge base.
- Do not give legal advice; you may mention that the site references ADA, IDEA, Rehabilitation Act, RID, NAIE, etc.

IMPORTANT STYLE EXAMPLES:
- User: "Explain the difference between translation and interpreting. Which service do I need?"
  Good style: "Good question — interpreting is for live communication, like appointments or meetings happening in real time. Translation is for converting content, like written documents or recorded material, into another language form. What are you trying to set up?"
- User: "Do you offer VRI?"
  Good style: "Yes — MLS does offer VRI for remote appointments and meetings. What kind of setting are you needing it for?"
- User: "How much do you charge?"
  Good style: "That depends on the type of assignment. On-site and VRI have different rate structures, and translation work is usually quoted per project after review. What kind of request are you looking at?"
- User: "I need an interpreter for a doctor appointment"
  Good style: "Got you. Is the appointment in person or virtual, and do you already know the date and time?"

CURRENT PAGE:
- Path: ${pathname}
- Label: ${pageLabel}

MLS KNOWLEDGE BASE:
${knowledge}
`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { messages = [], pageContext = {} } = body;
    const pathname = pageContext.pathname || '/';
    const pageLabel = getPageLabel(pathname);
    const knowledge = serializeKnowledgeBase();

    const response = await client.responses.create({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'system',
          content: buildSystemPrompt({ pathname, pageLabel, knowledge }),
        },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = (response.output_text || '').trim();

    if (!reply) {
      throw new Error('Empty response');
    }

    return res.status(200).json({
      reply,
      pageLabel,
      mode: 'openai-knowledge',
    });
  } catch (error) {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const pathname = body?.pageContext?.pathname || '/';
    const lastMessage = body?.messages?.slice(-1)?.[0]?.content || '';
    const fallback = getFallbackResponse({ message: lastMessage, pathname });

    return res.status(200).json({
      ...fallback,
      mode: 'fallback',
      pageLabel: getPageLabel(pathname),
    });
  }
}
