import { callVisionModel, extractJsonFromResponse, RetryOptions } from './client';
import { VisionAnalysisResult } from '@/types/api';

const VISION_SYSTEM_PROMPT = `You are an expert image analyst specializing in outdoor exploration photography. Analyze the provided image and extract structured information for creating a personalized travel journal.

Return ONLY valid JSON with this exact structure:
{
  "description": "string",
  "titleSuggestions": ["string"],
  "detectedObjects": ["string"],
  "detectedScenes": ["string"],
  "mood": "string",
  "notableDetails": ["string"],
  "storyElements": ["string"]
}

Guidelines:
- description: 1-2 factual sentences describing exactly what is visible and happening in THIS photo - the setting, the main subject, and any action or moment captured. Be concrete and specific ("A narrow paved road curves between flooded emerald rice paddies under a heavy grey sky, with palm trees on the far bank."), never generic ("A beautiful landscape.").
- titleSuggestions: 3-5 creative, evocative titles for the adventure
- detectedObjects: Specific objects, landmarks, flora, fauna, architectural elements
- detectedScenes: Broader scene types (e.g., "mountain trail", "urban park", "coastal path", "forest clearing")
- mood: Single word or short phrase describing the emotional atmosphere (e.g., "serene", "adventurous", "melancholic", "vibrant", "peaceful")
- notableDetails: Unique, specific visual details that make this adventure special (lighting, colors, textures, compositions)
- storyElements: Narrative threads or themes that could be woven into a story (journey, discovery, reflection, connection with nature)

Output the JSON object only. Do not include any reasoning, analysis, or commentary.`;

/** Builds a readable fallback description when the model omits the `description` field. */
function deriveDescription(parsed: Partial<VisionAnalysisResult>): string {
  const scenes = Array.isArray(parsed.detectedScenes) ? parsed.detectedScenes.slice(0, 2) : [];
  const objects = Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects.slice(0, 4) : [];
  const details = Array.isArray(parsed.notableDetails) ? parsed.notableDetails.slice(0, 1) : [];

  if (scenes.length === 0 && objects.length === 0) return 'Photo analyzed.';

  const subject = objects.length > 0 ? objects.join(', ') : scenes.join(', ');
  const place = scenes.length > 0 ? ` in a ${scenes.join(' / ')}` : '';
  const detail = details.length > 0 ? ` Notable for ${details[0]}.` : '';

  return `Featuring ${subject}${place}.${detail}`;
}

export async function analyzeImages(
  imageUrls: string[],
  retryOpts?: RetryOptions
): Promise<VisionAnalysisResult> {
  const maxRetries = retryOpts?.maxRetries ?? 2;
  const images = imageUrls.map((url) => ({ url }));
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callVisionModel(images, VISION_SYSTEM_PROMPT, retryOpts);
      const cleaned = extractJsonFromResponse(response);
      const parsed = JSON.parse(cleaned) as VisionAnalysisResult;

      // Validate required fields
      if (!parsed.titleSuggestions || !Array.isArray(parsed.titleSuggestions)) {
        throw new Error('Invalid titleSuggestions');
      }
      if (!parsed.detectedObjects || !Array.isArray(parsed.detectedObjects)) {
        throw new Error('Invalid detectedObjects');
      }
      if (!parsed.detectedScenes || !Array.isArray(parsed.detectedScenes)) {
        throw new Error('Invalid detectedScenes');
      }
      if (!parsed.mood || typeof parsed.mood !== 'string') {
        throw new Error('Invalid mood');
      }
      if (!parsed.notableDetails || !Array.isArray(parsed.notableDetails)) {
        throw new Error('Invalid notableDetails');
      }
      if (!parsed.storyElements || !Array.isArray(parsed.storyElements)) {
        throw new Error('Invalid storyElements');
      }

      const description =
        typeof parsed.description === 'string' && parsed.description.trim().length > 0
          ? parsed.description.trim()
          : deriveDescription(parsed);

      return {
        ...parsed,
        description: description.slice(0, 400),
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        console.warn(
          `[Vision] Analysis or parsing failed on attempt ${attempt + 1}/${maxRetries + 1} (${lastError.message}). Retrying vision analysis...`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error('Vision analysis parsing error after retries:', lastError);
  throw lastError || new Error('Failed to parse vision analysis response');
}
