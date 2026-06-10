import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILesson {
  title: string;
  type: 'video' | 'pdf' | 'quiz' | 'assignment';
  mediaUrl?: string;
  duration?: number;
  content?: string;
  order: number;
}

export interface IModule {
  title: string;
  description?: string;
  lessons: ILesson[];
  order: number;
}

export interface ICourseDocument extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  tutor: Types.ObjectId;
  thumbnailUrl: string;
  price: number;
  language: 'english' | 'spanish';
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: IModule[];
  totalDuration: number;
  totalLessons: number;
  isPublished: boolean;
  isActive: boolean;
  category: string;
  tags: string[];
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['video', 'pdf', 'quiz', 'assignment'], required: true },
    mediaUrl: { type: String },
    duration: { type: Number, min: 0 },
    content: { type: String },
    order: { type: Number, required: true },
  },
  { _id: true }
);

const moduleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true },
    description: { type: String },
    lessons: [lessonSchema],
    order: { type: Number, required: true },
  },
  { _id: true }
);

const courseSchema = new Schema<ICourseDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 200 },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnailUrl: { type: String },
    price: { type: Number, required: true, min: 0 },
    language: { type: String, enum: ['english', 'spanish'], required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    modules: [moduleSchema],
    totalDuration: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    category: { type: String, default: 'general' },
    tags: [{ type: String }],
    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

courseSchema.index({ language: 1, level: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ enrolledCount: -1 });

export const Course =
  mongoose.models.Course || mongoose.model<ICourseDocument>('Course', courseSchema);