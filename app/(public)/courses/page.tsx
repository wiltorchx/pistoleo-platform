'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseCard } from '@/components/molecules/CourseCard';
import { CourseFilters } from '@/components/molecules/CourseFilters';
import { CourseGridSkeleton } from '@/components/molecules/Skeletons';

interface CourseItem {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string;
  price: number;
  language: string;
  level: string;
  totalLessons: number;
  totalDuration: number;
  enrolledCount: number;
  rating: number;
  tutor?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

function CoursesList() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [language, setLanguage] = useState(searchParams.get('language') || 'all');
  const [level, setLevel] = useState(searchParams.get('level') || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('newest');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '12', sort });
      if (language !== 'all') params.set('language', language);
      if (level !== 'all') params.set('level', level);
      if (search) params.set('search', search);

      const res = await fetch(`/api/courses?${params}`);
      const data = await res.json();
      setCourses(data.courses || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [language, level, search, sort, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  return (
    <div className="space-y-6">
      <CourseFilters
        language={language}
        level={level}
        search={search}
        sort={sort}
        onLanguageChange={setLanguage}
        onLevelChange={setLevel}
        onSearchChange={setSearch}
        onSortChange={setSort}
      />

      {loading ? (
        <CourseGridSkeleton count={6} />
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron cursos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id} {...course} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-surface-light-muted dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Cursos</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Explora nuestros cursos de inglés y español
          </p>
        </div>

        <Suspense fallback={<CourseGridSkeleton count={6} />}>
          <CoursesList />
        </Suspense>
      </div>
    </div>
  );
}