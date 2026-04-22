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

    const systemPrompt = `
You are the assistant for Miqueas Language Solutions (MLS).

Rules:
- Only answer based on MLS services and realistic interpreting workflows
- Do NOT make up pricing or availability
- If user needs a quote → direct them to the contact page
- If urgent → tell them to call or email
- If interpreter wants work → send them to interpreter resources
- Keep answers short, clear, and helpful

Current page: ${pathname}
Page: ${getPageLabel(pathname)}
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
      pageLabel: getPageLabel(pathname),
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
