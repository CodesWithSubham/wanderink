import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAdventureLike extends Document {
  userId: Types.ObjectId;
  adventureId: Types.ObjectId;
  createdAt: Date;
}

const adventureLikeSchema = new Schema<IAdventureLike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adventureId: {
      type: Schema.Types.ObjectId,
      ref: 'Adventure',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

adventureLikeSchema.index({ userId: 1, adventureId: 1 }, { unique: true });
adventureLikeSchema.index({ adventureId: 1 });

export const AdventureLike = mongoose.models.AdventureLike || mongoose.model<IAdventureLike>('AdventureLike', adventureLikeSchema);