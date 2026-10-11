import mongoose, { Document, Schema, Types } from 'mongoose';

export type AdventureVisibility = 'private' | 'public';
export type AdventureStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface IAdventure extends Document {
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

const adventureSchema = new Schema<IAdventure>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    story: {
      type: String,
      default: '',
    },
    highlights: [{
      type: String,
      trim: true,
    }],
    imageKeys: [{
      type: String,
      required: true,
    }],
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
      index: true,
    },
    moodScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'completed', 'failed'],
      default: 'draft',
    },
    generationError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

adventureSchema.index({ userId: 1, createdAt: -1 });
adventureSchema.index({ visibility: 1, createdAt: -1 });
adventureSchema.index({ likesCount: -1 });
adventureSchema.index({ moodScore: -1 });
adventureSchema.index({ title: 'text', summary: 'text', highlights: 'text' });

export const Adventure = mongoose.models.Adventure || mongoose.model<IAdventure>('Adventure', adventureSchema);