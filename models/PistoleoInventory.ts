import mongoose, { Schema, Document } from 'mongoose';

export interface IPistoleoInventory extends Document {
  batchId: mongoose.Types.ObjectId;
  upc: string;
  description?: string;
  expectedQuantity: number;
  actualQuantity: number;
  status: 'missing' | 'partial' | 'complete' | 'over';
  updatedAt: Date;
}

const pistoleoInventorySchema = new Schema<IPistoleoInventory>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'PistoleoBatch', required: true },
    upc: { type: String, required: true, trim: true },
    description: { type: String },
    expectedQuantity: { type: Number, required: true, min: 0 },
    actualQuantity: { type: Number, default: 0, min: 0 },
    status: { 
      type: String, 
      enum: ['missing', 'partial', 'complete', 'over'], 
      default: 'missing' 
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// Index for faster lookup during scanning
pistoleoInventorySchema.index({ batchId: 1, upc: 1 }, { unique: true });

export const PistoleoInventory = mongoose.models.PistoleoInventory || mongoose.model<IPistoleoInventory>('PistoleoInventory', pistoleoInventorySchema);
