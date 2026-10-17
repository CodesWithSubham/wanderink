import { callVisionModel, extractJsonFromResponse, RetryOptions } from './client';
import { VisionAnalysisResult } from '@/types/api';

const VISION_SYSTEM_PROMPT = `You are an expert image analyst specializing in outdoor exploration photography. Analyze the provided images and extract structured information for creating a personalized travel journal.

Return ONLY valid JSON with this exact structure:
{
  "titleSuggestions": ["string"],
  "detectedObjects": ["string"],
  "detectedScenes": ["string"],
  "mood": "string",
  "notableDetails": ["string"],
  "storyElements": ["string"]
}

Guidelines:
- titleSuggestions: 3-5 creative, evocative titles for the adventure
- detectedObjects: Specific objects, landmarks, flora, fauna, architectural elements
- detectedScenes: Broader scene types (e.g., "mountain trail", "urban park", "coastal path", "forest clearing")
- mood: Single word or short phrase describing the emotional atmosphere (e.g., "serene", "adventurous", "melancholic", "vibrant", "peaceful")
- notableDetails: Unique, specific visual details that make this adventure special (lighting, colors, textures, compositions)
- storyElements: Narrative threads or themes that could be woven into a story (journey, discovery, reflection, connection with nature)`;

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

      return parsed;
    } catch (error: any) {
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