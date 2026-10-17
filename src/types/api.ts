export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl?: string;
  getUrl?: string;
}

export interface VisionAnalysisResult {
  /** 1-2 factual sentences describing exactly what is visible/happening in the photo. */
  description: string;
  titleSuggestions: string[];
  detectedObjects: string[];
  detectedScenes: string[];
  mood: string;
  notableDetails: string[];
  storyElements: string[];
}

/**
 * Condensed, display-friendly view of a single photo's analysis.
 * Streamed to the client so the progress screen can show what the AI
 * actually perceived in each image, as it perceives it.
 */
export interface ImageAnalysisSummary {
  description: string;
  mood: string;
  scenes: string[];
  objects: string[];
  details: string[];
}

export interface StoryAnalysisInput {
  titleSuggestions: string[];
  detectedObjects: string[];
  detectedScenes: string[];
  mood: string;
  notableDetails: string[];
  storyElements: string[];
  imageDescriptions?: string[];
}

export interface StoryGenerationResult {
  title: string;
  summary: string;
  fullStory: string;
  highlights: string[];
  moodScore: number;
}

export interface GenerationProgressEvent {
  type: 'vision_start' | 'vision_progress' | 'vision_complete' | 'story_start' | 'story_complete' | 'done' | 'error';
  data: Record<string, unknown>;
}

export interface SSEMessage {
  event: string;
  data: string;
}