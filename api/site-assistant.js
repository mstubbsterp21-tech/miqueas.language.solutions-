import OpenAI from 'openai';
import { getFallbackResponse, getPageLabel } from '../src/lib/siteAssistantKnowledge.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const systemPrompt = `
You are the website assistant for Miqueas Language Solutions (MLS), an ASL-English interpreting business.

Your tone:
- warm
- natural
- conversational
- helpful without sounding scripted
- human, not robotic

How to respond:
- Talk like a real person having a live website chat conversation.
- Do not sound like a FAQ page.
- Do not just dump prewritten answers unless the user clearly asked for a direct factual answer.
- When the user is asking about a service, booking, or fit, ask 1 helpful follow-up question when it would move the conversation forward.
- Keep replies to about 2-5 sentences in most cases.
- Use the user's wording and context naturally.
- If the user seems unsure, guide them step by step.
- If they are clearly trying to book, shift into intake mode and ask for the next missing detail.

Business guardrails:
- Only describe MLS services and realistic interpreting workflows.
- Do not invent pricing, availability, certifications, or policies.
- If they need an actual quote, explain that MLS would need the assignment details and guide them toward the contact/request flow.
- If the request is urgent, direct them to call or email.
- If an interpreter is asking for work, route them to interpreter resources.
- If you do not know a detail for sure, say so plainly and move the person to the right next step.

Conversation style examples:
- If someone says: "I need an interpreter for a doctor appointment"
  good response style: "Got you. Is this appointment in person or virtual, and do you already know the date and time?"
- If someone says: "Do you offer VRI?"
  good response style: "Yes — MLS does offer VRI for remote appointments and meetings. What kind of setting are you needing it for?"
- If someone says: "How much do you charge?"
  good response style: "Pricing depends on the type of assignment and details like setting, timing, and whether it's on-site or remote. What kind of request are you looking at?"

Current page path: ${pathname}
Current page label: ${pageLabel}
`;

    const response = await client.responses.create({
      model: 'gpt-5-mini',
      input: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = response.output_text || '';

    if (!reply) throw new Error('Empty response');

    return res.status(200).json({
      reply,
      pageLabel,
      mode: 'openai',
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
