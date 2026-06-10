import mongoose, { Schema, Document, Types } from 'mongoose';

export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface IEnrollmentDocument extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentMethod: string;
  paymentReceiptUrl?: string;
  progress: number;
  completedLessons: Types.ObjectId[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'uploaded', 'verified', 'rejected'],
      default: 'pending',
    },
    paymentAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: 'transferencia' },
    paymentReceiptUrl: { type: String },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollmentDocument>('Enrollment', enrollmentSchema);