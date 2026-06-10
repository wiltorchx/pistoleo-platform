import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock } from 'lucide-react';

interface TutorCardProps {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  hourlyRate?: number;
  languages?: string[];
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
}

export function TutorCard({
  _id,
  firstName,
  lastName,
  avatarUrl,
  bio,
  hourlyRate,
  languages = [],
  rating,
  reviewCount,
}: TutorCardProps) {
  return (
    <Link href={`/tutors/${_id}`} className="group block">
      <div className="bg-white dark:bg-surface-dark-elevated rounded-2xl shadow-card overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/30 dark:to-surface-dark flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-300 flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={firstName} className="w-full h-full object-cover" width={64} height={64} />
            ) : (
              `${firstName[0]}${lastName[0]}`
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {firstName} {lastName}
            </h3>

            {bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{bio}</p>
            )}

            <div className="flex items-center flex-wrap gap-2 mt-2">
              {rating && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-4 h-4 text-warning" />
                  {rating.toFixed(1)} ({reviewCount || 0})
                </span>
              )}
              {hourlyRate && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-4 h-4" />
                  ${hourlyRate}/h
                </span>
              )}
            </div>

            {languages.length > 0 && (
              <div className="flex gap-1 mt-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}