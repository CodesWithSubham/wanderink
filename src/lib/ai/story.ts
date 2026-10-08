import { callStoryModel } from './client';
import { StoryGenerationResult } from '@/types/api';

const STORY_SYSTEM_PROMPT = `You are an expert travel writer and storyteller. Create an inspiring, personal exploration journal based on the provided image analysis.

Write in first person ("I walked...", "I discovered..."). Sound authentic, reflective, and emotionally resonant. Avoid hallucinating impossible events or specific facts not in the analysis. Reference actual visual details from the analysis.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "summary": "string",
  "fullStory": "string",
  "highlights": ["string"],
  "moodScore": number
}

Guidelines:
- title: Evocative, memorable title (max 80 chars)
- summary: 2-3 sentences capturing the essence (max 300 chars)
- fullStory: Rich, immersive narrative (800-2000 words). Use sensory details, emotional reflection, natural pacing. Paragraphs separated by double newlines.
- highlights: 3-5 key moments or discoveries as bullet points
- moodScore: 1-10 integer representing the emotional tone (1=melancholic/somber, 5=balanced/reflective, 10=joyful/uplifting)

Writing style:
- Personal and intimate, like a private journal
- Sensory-rich: sights, sounds, smells, textures
- Emotionally honest, not artificially positive
- Grounded in the actual visual evidence
- Literary but accessible
- Avoid clichés and generic travel writing tropes`;

function buildUserPrompt(analysis: {
  titleSuggestions: string[];
  detectedObjects: string[];
  detectedScenes: string[];
  mood: string;
  notableDetails: string[];
  storyElements: string[];
}): string {
  return `Image Analysis:
- Suggested Titles: ${analysis.titleSuggestions.join(', ')}
- Detected Objects: ${analysis.detectedObjects.join(', ')}
- Detected Scenes: ${analysis.detectedScenes.join(', ')}
- Mood: ${analysis.mood}
- Notable Details: ${analysis.notableDetails.join('; ')}
- Story Elements: ${analysis.storyElements.join('; ')}

Create a personal exploration journal from this analysis. The story should feel like it was written by someone who was actually there, experiencing these moments.`;
}

export async function generateStory(analysis: {
  titleSuggestions: string[];
  detectedObjects: string[];
  detectedScenes: string[];
  mood: string;
  notableDetails: string[];
  storyElements: string[];
}): Promise<StoryGenerationResult> {
  const userPrompt = buildUserPrompt(analysis);
  const response = await callStoryModel(STORY_SYSTEM_PROMPT, userPrompt);

  try {
    const parsed = JSON.parse(response) as StoryGenerationResult;

    // Validate required fields
    if (!parsed.title || typeof parsed.title !== 'string') {
      throw new Error('Invalid title');
    }
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid summary');
    }
    if (!parsed.fullStory || typeof parsed.fullStory !== 'string') {
      throw new Error('Invalid fullStory');
    }
    if (!parsed.highlights || !Array.isArray(parsed.highlights)) {
      throw new Error('Invalid highlights');
    }
    if (!parsed.moodScore || typeof parsed.moodScore !== 'number' || parsed.moodScore < 1 || parsed.moodScore > 10) {
      throw new Error('Invalid moodScore');
    }

    return {
      title: parsed.title.slice(0, 80),
      summary: parsed.summary.slice(0, 300),
      fullStory: parsed.fullStory,
      highlights: parsed.highlights.slice(0, 5),
      moodScore: Math.round(Math.max(1, Math.min(10, parsed.moodScore))),
    };
  } catch (error) {
    console.error('Story generation parsing error:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse story generation response');
  }
}