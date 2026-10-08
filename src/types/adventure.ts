import { Types } from 'mongoose';

export type AdventureVisibility = 'private' | 'public';
export type AdventureStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface IAdventure {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  summary: string;
  story: string;
  highlights: string[];
  imageKeys: string[];
  visibility: AdventureVisibility;
  moodScore: number;
  likesCount: number;
  status: AdventureStatus;
  generationError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdventureResponse {
  id: string;
  userId: string;
  title: string;
  summary: string;
  story: string;
  highlights: string[];
  imageUrls: string[];
  visibility: AdventureVisibility;
  moodScore: number;
  likesCount: number;
  status: AdventureStatus;
  generationError?: string;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdventureInput {
  imageKeys: string[];
  visibility: AdventureVisibility;
}

export interface UpdateAdventureInput {
  visibility?: AdventureVisibility;
  title?: string;
}

export interface AdventureStats {
  totalAdventures: number;
  totalPhotos: number;
  totalStories: number;
}

export interface PublicAdventureQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'newest' | 'popular' | 'mood';
}