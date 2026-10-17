import { callStoryModel, extractJsonFromResponse, RetryOptions } from './client';
import { StoryGenerationResult } from '@/types/api';

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

Do not output any thoughts, preamble, or markdown outside the JSON.`;

function buildUserPrompt(analysis: {
  titleSuggestions: string[];
  detectedObjects: string[];
  detectedScenes: string[];
  mood: string;
  notableDetails: string[];
  storyElements: string[];
}): string {
  return `Visual Analysis Findings:
- Suggested Titles: ${analysis.titleSuggestions.join(', ')}
- Detected Objects: ${analysis.detectedObjects.join(', ')}
- Detected Scenes: ${analysis.detectedScenes.join(', ')}
- Mood: ${analysis.mood}
- Notable Details: ${analysis.notableDetails.join('; ')}
- Story Elements: ${analysis.storyElements.join('; ')}

Output the JSON object:`;
}

export async function generateStory(
  analysis: {
    titleSuggestions: string[];
    detectedObjects: string[];
    detectedScenes: string[];
    mood: string;
    notableDetails: string[];
    storyElements: string[];
  },
  retryOpts?: RetryOptions
): Promise<StoryGenerationResult> {
  const maxRetries = retryOpts?.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const userPrompt = buildUserPrompt(analysis);
      const response = await callStoryModel(STORY_SYSTEM_PROMPT, userPrompt, retryOpts);

      const cleaned = extractJsonFromResponse(response);
      const parsed = JSON.parse(cleaned) as Record<string, any>;

      // Ensure at least title or summary/fullStory is present
      if (!parsed.title && !parsed.fullStory && !parsed.summary) {
        throw new Error('Response did not contain valid journal fields');
      }

      const defaultTitle = analysis.titleSuggestions[0] || 'Journey into the Mist';
      const title = String(parsed.title || defaultTitle).slice(0, 80);
      const fullStory = String(parsed.fullStory || parsed.summary || 'A quiet morning amidst nature.').trim();
      const summary = String(parsed.summary || fullStory.slice(0, 250)).slice(0, 300);

      const highlights = Array.isArray(parsed.highlights) && parsed.highlights.length > 0
        ? parsed.highlights.slice(0, 5).map(String)
        : [
            analysis.notableDetails[0] || 'Exploring misty pine trails',
            'Sunlight breaking through the mountain canopy',
            'Moments of stillness and contemplation on the ridge',
          ];

      const rawMood = typeof parsed.moodScore === 'number' ? parsed.moodScore : parseInt(parsed.moodScore, 10);
      const moodScore = !isNaN(rawMood) ? Math.round(Math.max(1, Math.min(10, rawMood))) : 8;

      return {
        title,
        summary,
        fullStory,
        highlights,
        moodScore,
      };
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        console.warn(
          `[Story] Parsing or validation failed on attempt ${attempt + 1}/${maxRetries + 1} (${lastError.message}). Retrying story generation...`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error('Story generation failed after retries:', lastError);
  throw lastError || new Error('Failed to parse story generation response');
}