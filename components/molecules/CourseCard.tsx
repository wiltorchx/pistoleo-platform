import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen, Star, Users } from 'lucide-react';

interface CourseCardProps {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string;
  price: number;
  language: string;
  level: string;
  totalLessons?: number;
  totalDuration?: number;
  enrolledCount?: number;
  rating?: number;
  tutor?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export function CourseCard({
  title,
  slug,
  shortDescription,
  thumbnailUrl,
  price,
  language,
  level,
  totalLessons,
  totalDuration,
  enrolledCount,
  rating,
  tutor,
}: CourseCardProps) {
  const langLabel = language === 'english' ? 'Inglés' : 'Español';
  const levelLabel =
    level === 'beginner' ? 'Principiante' : level === 'intermediate' ? 'Intermedio' : 'Avanzado';

  return (
    <Link href={`/courses/${slug}`} className="group block">
      <div className="bg-white dark:bg-surface-dark-elevated rounded-2xl shadow-card overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800 h-full">
        <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-surface-dark">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary-600/40" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-white/90 dark:bg-gray-800/90 rounded-full text-gray-700 dark:text-gray-200">
              {langLabel}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-primary-600/90 text-white rounded-full">
              {levelLabel}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1">
            {title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {shortDescription}
          </p>

          {tutor && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Por {tutor.firstName} {tutor.lastName}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {totalLessons && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {totalLessons} lecciones
              </span>
            )}
            {totalDuration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xl font-bold text-primary-600">
              ${price.toLocaleString()}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning" />
                  {rating.toFixed(1)}
                </span>
              )}
              {enrolledCount && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {enrolledCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}