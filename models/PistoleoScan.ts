import mongoose, { Schema, Document } from 'mongoose';

export interface IPistoleoScan extends Document {
  batchId: mongoose.Types.ObjectId;
  upc: string;
  userId: mongoose.Types.ObjectId;
  scannedAt: Date;
}

const pistoleoScanSchema = new Schema<IPistoleoScan>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'PistoleoBatch', required: true },
    upc: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

pistoleoScanSchema.index({ batchId: 1, upc: 1 });

export const PistoleoScan = mongoose.models.PistoleoScan || mongoose.model<IPistoleoScan>('PistoleoScan', pistoleoScanSchema);
