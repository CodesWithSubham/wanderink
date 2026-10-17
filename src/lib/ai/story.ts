import { callStoryModel, extractJsonFromResponse, RetryOptions } from './client';
import { StoryGenerationResult, StoryAnalysisInput } from '@/types/api';

const STORY_SYSTEM_PROMPT = `You are an expert travel writer. Create an inspiring exploration journal based on the image analysis.
Write in first person ("I walked...", "I discovered..."). Sound authentic, reflective, and emotionally resonant. Reference actual visual details from the analysis.

Output ONLY a valid JSON object matching this schema:
{
  "title": "Evocative title (max 80 chars)",
  "summary": "2-3 sentences summary (max 300 chars)",
  "fullStory": "Immersive narrative (300-500 words) with double newlines between paragraphs",
  "highlights": ["3-5 bullet point highlights"],
  "moodScore": 8
}

Do not output any thoughts, preamble, or markdown outside the JSON. Your entire reply must begin with "{" and end with "}". Always finish the "fullStory" string - never stop mid-sentence.`;

/**
 * Used from the second attempt onwards. A first attempt that fails has almost
 * always either leaked a reasoning preamble or been cut off mid-answer, so the
 * retry is told exactly what went wrong.
 */
const STORY_RETRY_INSTRUCTION = `

CRITICAL: A previous attempt was rejected because the reply contained reasoning text or the story was cut off before it ended. Reply now with one complete JSON object and nothing else. Do not think out loud, do not explain, and do not stop until the closing "}" of the JSON object has been written.`;

const MIN_FULL_STORY_CHARS = 400;
const MIN_SUMMARY_CHARS = 40;
const MIN_HIGHLIGHTS = 3;

/** Trims text to `max` characters without slicing through the middle of a word. */
function clampText(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;

  const clipped = trimmed.slice(0, max);
  const lastSentenceEnd = Math.max(
    clipped.lastIndexOf('. '),
    clipped.lastIndexOf('! '),
    clipped.lastIndexOf('? ')
  );
  if (lastSentenceEnd > max * 0.5) {
    return clipped.slice(0, lastSentenceEnd + 1).trim();
  }

  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 0 ? lastSpace : max).trim()}…`;
}

function buildUserPrompt(analysis: StoryAnalysisInput): string {
  const lines = ['Visual Analysis Findings:'];

  if (analysis.imageDescriptions && analysis.imageDescriptions.length > 0) {
    analysis.imageDescriptions.forEach((description, index) => {
      lines.push(`- Photo ${index + 1}: ${description}`);
    });
  }

  lines.push(
    `- Suggested Titles: ${analysis.titleSuggestions.join(', ')}`,
    `- Detected Objects: ${analysis.detectedObjects.join(', ')}`,
    `- Detected Scenes: ${analysis.detectedScenes.join(', ')}`,
    `- Mood: ${analysis.mood}`,
    `- Notable Details: ${analysis.notableDetails.join('; ')}`,
    `- Story Elements: ${analysis.storyElements.join('; ')}`,
    '',
    'Write the journal as a single, complete JSON object. Output the JSON object only:'
  );

  return lines.join('\n');
}

/**
 * Rejects anything that would produce a broken journal entry:
 * a reasoning-only reply, a reply that was cut off mid-story, or a reply that
 * is missing the fields the reader UI needs.
 */
function normalizeStory(parsed: Record<string, unknown>): StoryGenerationResult {
  const title = String(parsed.title ?? '').trim();
  const summary = String(parsed.summary ?? '').trim();
  const fullStory = String(parsed.fullStory ?? '').trim();

  if (title.length < 3) {
    throw new Error('Story response is missing a usable title');
  }
  if (fullStory.length < MIN_FULL_STORY_CHARS) {
    throw new Error(
      `Story response was incomplete (${fullStory.length} chars, expected at least ${MIN_FULL_STORY_CHARS}) - the model most likely stopped mid-sentence`
    );
  }
  if (summary.length < MIN_SUMMARY_CHARS) {
    throw new Error('Story response is missing a usable summary');
  }

  const rawHighlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];
  const highlights = rawHighlights
    .map((highlight) => String(highlight).trim())
    .filter((highlight) => highlight.length > 0)
    .slice(0, 5)
    .map((highlight) => clampText(highlight, 140));

  if (highlights.length < MIN_HIGHLIGHTS) {
    throw new Error('Story response did not include enough highlights');
  }

  const rawMood = typeof parsed.moodScore === 'number' ? parsed.moodScore : parseInt(String(parsed.moodScore), 10);
  const moodScore = !isNaN(rawMood) && rawMood > 0 ? Math.round(Math.max(1, Math.min(10, rawMood))) : 8;

  return {
    title: clampText(title, 80),
    summary: clampText(summary, 300),
    fullStory,
    highlights,
    moodScore,
  };
}

export async function generateStory(
  analysis: StoryAnalysisInput,
  retryOpts?: RetryOptions
): Promise<StoryGenerationResult> {
  const maxRetries = retryOpts?.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const systemPrompt =
        attempt === 0 ? STORY_SYSTEM_PROMPT : `${STORY_SYSTEM_PROMPT}${STORY_RETRY_INSTRUCTION}`;
      const userPrompt = buildUserPrompt(analysis);
      const response = await callStoryModel(systemPrompt, userPrompt, retryOpts);

      const cleaned = extractJsonFromResponse(response);
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      return normalizeStory(parsed);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        console.warn(
          `[Story] Generation failed on attempt ${attempt + 1}/${maxRetries + 1} (${lastError.message}). Retrying story generation...`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error('Story generation failed after retries:', lastError);
  throw lastError || new Error('Failed to generate a complete story');
}
