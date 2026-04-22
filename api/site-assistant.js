import { getFallbackResponse, getPageLabel } from '../src/lib/siteAssistantKnowledge.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { messages = [], pageContext = {} } = body;
  const pathname = pageContext.pathname || '/';
  const userMessage = [...messages]
    .reverse()
    .find((message) => message?.role === 'user' && typeof message?.content === 'string')
    ?.content?.trim();

  const fallback = getFallbackResponse({ message: userMessage, pathname });

  return res.status(200).json({
    ...fallback,
    mode: 'rules',
    pageLabel: getPageLabel(pathname),
  });
}
