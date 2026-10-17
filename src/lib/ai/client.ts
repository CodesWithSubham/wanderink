export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  stream?: boolean;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableStatusCodes?: number[];
}

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export function getAIConfig() {
  const baseUrl = process.env.OMNIROUTE_BASE_URL;
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const visionModel = process.env.VISION_MODEL;
  const storyModel = process.env.STORY_MODEL;

  if (!baseUrl || !apiKey || !visionModel || !storyModel) {
    throw new Error(
      'Missing AI environment variables (OMNIROUTE_BASE_URL, OMNIROUTE_API_KEY, VISION_MODEL, STORY_MODEL)'
    );
  }

  return { baseUrl, apiKey, visionModel, storyModel };
}

// Export constants for backward compatibility
export const VISION_MODEL = process.env.VISION_MODEL || '';
export const STORY_MODEL = process.env.STORY_MODEL || '';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function callOmniRoute(
  request: ChatCompletionRequest,
  timeoutMs: number,
  retryOpts?: RetryOptions
): Promise<string> {
  const config = getAIConfig();
  const options: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOpts,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${config.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(request),
        },
        timeoutMs
      );

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `OmniRoute API error: ${response.status} - ${errorText}`;
        const isRetryable = options.retryableStatusCodes.includes(response.status);

        if (!isRetryable || attempt === options.maxRetries) {
          throw new Error(errorMessage);
        }

        const delay = Math.min(
          options.initialDelayMs * Math.pow(options.backoffFactor, attempt) + Math.floor(Math.random() * 1000),
          options.maxDelayMs
        );
        console.warn(
          `[OmniRoute] Request for model '${request.model}' failed with status ${response.status}. Retry attempt ${attempt + 1}/${options.maxRetries} in ${Math.round(delay)}ms...`
        );
        lastError = new Error(errorMessage);
        await sleep(delay);
        continue;
      }

      const data: ChatCompletionResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      return content;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // If it's a non-retryable API error (4xx client errors other than 408/429), rethrow immediately
      const isClientError = /OmniRoute API error: (4\d\d)/.exec(err.message);
      if (isClientError) {
        const statusCode = parseInt(isClientError[1], 10);
        if (!options.retryableStatusCodes.includes(statusCode)) {
          throw err;
        }
      }

      if (attempt === options.maxRetries) {
        throw err;
      }

      const delay = Math.min(
        options.initialDelayMs * Math.pow(options.backoffFactor, attempt) + Math.floor(Math.random() * 1000),
        options.maxDelayMs
      );
      console.warn(
        `[OmniRoute] Request for model '${request.model}' failed (${err.name}: ${err.message}). Retry attempt ${attempt + 1}/${options.maxRetries} in ${Math.round(delay)}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('OmniRoute request failed after retries');
}

/**
 * Sanitizes JSON strings by escaping unescaped literal control characters
 * (like newlines or tabs) inside quoted string values without touching structural JSON.
 */
export function sanitizeJsonString(jsonStr: string): string {
  let insideString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      result += char;
      continue;
    }

    if (char === '"') {
      insideString = !insideString;
      result += char;
      continue;
    }

    if (insideString) {
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
    }

    result += char;
  }

  return result;
}

/**
 * Repairs unclosed / truncated JSON outputs (e.g. when LLM reaches max output tokens).
 */
export function repairTruncatedJson(jsonStr: string): string {
  let cleaned = jsonStr.trim();

  // Find start of relevant JSON: {"title" or {"titleSuggestions"
  const start = cleaned.search(/\{\s*"(?:title|titleSuggestions)"/i);
  if (start !== -1) {
    cleaned = cleaned.substring(start);
  } else {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace);
    }
  }

  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        const last = stack[stack.length - 1];
        if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
          stack.pop();
        }
      }
    }
  }

  let repaired = cleaned;
  if (inString) {
    repaired += '"';
  }

  repaired = repaired.replace(/,\s*$/, '').replace(/:\s*$/, ': ""');

  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') repaired += '}';
    else if (open === '[') repaired += ']';
  }

  return sanitizeJsonString(repaired);
}

/**
 * Robustly extracts and verifies a JSON object from raw LLM output.
 * Handles thought processes (<think>...</think>, "Here's a thinking process:"),
 * markdown code blocks, preambles with curly braces, and truncated outputs.
 */
export function extractJsonFromResponse(raw: string): string {
  let cleaned = raw.trim();

  // Strip <think>...</think> blocks if produced by reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 1. Check if the string as a whole is already valid JSON
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // continue
  }

  // 2. Scan for markdown code fences (```json ... ``` or ``` ... ```) in reverse order
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  const fenceMatches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = fenceRegex.exec(cleaned)) !== null) {
    fenceMatches.push(m[1].trim());
  }

  for (let i = fenceMatches.length - 1; i >= 0; i--) {
    const candidate = fenceMatches[i];
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return candidate;
    } catch {
      const sanitized = sanitizeJsonString(candidate);
      try {
        const parsed = JSON.parse(sanitized);
        if (parsed && typeof parsed === 'object') return sanitized;
      } catch {
        // try repair
        try {
          const rep = repairTruncatedJson(candidate);
          const parsedRep = JSON.parse(rep);
          if (parsedRep && typeof parsedRep === 'object') return rep;
        } catch {
          // continue
        }
      }
    }
  }

  // 3. Scan for balanced JSON objects { ... } across the text
  const candidates: string[] = [];
  let depth = 0;
  let startIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '{') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        candidates.push(cleaned.substring(startIdx, i + 1));
        startIdx = -1;
      }
    }
  }

  // Check candidates in reverse order (models emit the final structured output at the end)
  for (let i = candidates.length - 1; i >= 0; i--) {
    const cand = candidates[i];
    try {
      const parsed = JSON.parse(cand);
      if (parsed && typeof parsed === 'object' && ('title' in parsed || 'titleSuggestions' in parsed)) {
        return cand;
      }
    } catch {
      const sanitized = sanitizeJsonString(cand);
      try {
        const parsed = JSON.parse(sanitized);
        if (parsed && typeof parsed === 'object' && ('title' in parsed || 'titleSuggestions' in parsed)) {
          return sanitized;
        }
      } catch {
        // continue
      }
    }
  }

  // Check any candidate that parses as any valid object
  for (let i = candidates.length - 1; i >= 0; i--) {
    const cand = candidates[i];
    try {
      const parsed = JSON.parse(cand);
      if (parsed && typeof parsed === 'object') return cand;
    } catch {
      const sanitized = sanitizeJsonString(cand);
      try {
        const parsed = JSON.parse(sanitized);
        if (parsed && typeof parsed === 'object') return sanitized;
      } catch {
        // continue
      }
    }
  }

  // 4. Fallback: try repair on the target JSON substring
  const repaired = repairTruncatedJson(cleaned);
  try {
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === 'object') return repaired;
  } catch {
    // continue
  }

  // 5. Fallback: try from first '{' to last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const cand = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      JSON.parse(cand);
      return cand;
    } catch {
      const sanitized = sanitizeJsonString(cand);
      try {
        JSON.parse(sanitized);
        return sanitized;
      } catch {
        // continue
      }
    }
  }

  return cleaned;
}

export async function callVisionModel(
  images: Array<{ url: string; prompt?: string }>,
  systemPrompt: string,
  retryOpts?: RetryOptions
): Promise<string> {
  const config = getAIConfig();
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
      model: config.visionModel,
      messages,
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    },
    600000, // 10 minutes timeout matching nginx proxy_read_timeout
    retryOpts
  );
}

export async function callStoryModel(
  systemPrompt: string,
  userPrompt: string,
  retryOpts?: RetryOptions
): Promise<string> {
  const config = getAIConfig();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return callOmniRoute(
    {
      model: config.storyModel,
      messages,
      temperature: 0.3,
      max_tokens: 8192, // Generous token allowance for reasoning + story
    },
    600000, // 10 minutes timeout matching nginx proxy_read_timeout
    retryOpts
  );
}