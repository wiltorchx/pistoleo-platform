import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'student' | 'tutor' | 'admin';
  avatarUrl?: string;
  bio?: string;
  hourlyRate?: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  termsAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 500 },
    hourlyRate: { type: Number, min: 0 },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    termsAccepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interface UserJson extends Record<string, unknown> {
  password?: string;
  emailVerificationToken?: string;
}

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    const r = ret as UserJson;
    delete r.password;
    delete r.emailVerificationToken;
    return r;
  },
});

export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
