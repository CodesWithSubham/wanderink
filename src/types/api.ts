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
  titleSuggestions: string[];
  detectedObjects: string[];
  detectedScenes: string[];
  mood: string;
  notableDetails: string[];
  storyElements: string[];
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