const OMNIROUTE_BASE_URL = process.env.OMNIROUTE_BASE_URL!;
const OMNIROUTE_API_KEY = process.env.OMNIROUTE_API_KEY!;
const VISION_MODEL = process.env.VISION_MODEL!;
const STORY_MODEL = process.env.STORY_MODEL!;

if (!OMNIROUTE_BASE_URL || !OMNIROUTE_API_KEY || !VISION_MODEL || !STORY_MODEL) {
  throw new Error('Missing AI environment variables');
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  stream?: boolean;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOmniRoute(
  request: ChatCompletionRequest,
  timeoutMs: number
): Promise<string> {
  const response = await fetchWithTimeout(
    `${OMNIROUTE_BASE_URL}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OMNIROUTE_API_KEY}`,
      },
      body: JSON.stringify(request),
    },
    timeoutMs
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OmniRoute API error: ${response.status} - ${error}`);
  }

  const data: ChatCompletionResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function callVisionModel(
  images: Array<{ url: string; prompt?: string }>,
  systemPrompt: string
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: images.map((img) => ({
        type: 'image_url',
        image_url: { url: img.url },
      })),
    },
  ];

  return callOmniRoute(
    {
      model: VISION_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    },
    120000 // 2 minutes timeout for vision
  );
}

export async function callStoryModel(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return callOmniRoute(
    {
      model: STORY_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    },
    180000 // 3 minutes timeout for story generation
  );
}

export { VISION_MODEL, STORY_MODEL };