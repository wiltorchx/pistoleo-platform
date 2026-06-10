import mongoose, { Schema, Document } from 'mongoose';

export interface IPistoleoBatch extends Document {
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pistoleoBatchSchema = new Schema<IPistoleoBatch>(
  {
    name: { type: String, required: true, trim: true },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed'], 
      default: 'pending' 
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PistoleoBatch = mongoose.models.PistoleoBatch || mongoose.model<IPistoleoBatch>('PistoleoBatch', pistoleoBatchSchema);
