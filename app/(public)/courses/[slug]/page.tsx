import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, BookOpen, BarChart3, Users, Star, Play, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button';

async function getCourse(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const res = await fetch(`${baseUrl}/courses/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.course;
}

function EnrollButton({ courseId }: { courseId: string }) {
  return (
    <form
      action={async () => {
        'use server';
        const { cookies } = await import('next/headers');
        const token = (await cookies()).get('auth_token')?.value;
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/enrollments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: `auth_token=${token}` },
          body: JSON.stringify({ courseId }),
        });
        await res.json();
        // redirect doesn't work inside server actions reliably across network
      }}
    >
      <Button type="submit" variant="primary" size="lg" fullWidth>
        Inscribirse - ${0}
      </Button>
    </form>
  );
}

interface CourseModule {
  _id: string;
  title: string;
  description?: string;
  lessons?: CourseLesson[];
}

interface CourseLesson {
  _id: string;
  title: string;
  type: string;
  duration?: number;
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const langLabel = course.language === 'english' ? 'Inglés' : 'Español';
  const levelLabel =
    course.level === 'beginner'
      ? 'Principiante'
      : course.level === 'intermediate'
      ? 'Intermedio'
      : 'Avanzado';

  return (
    <div className="min-h-screen bg-surface-light-muted dark:bg-surface-dark">
      <div className="bg-gradient-to-br from-primary-600 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a cursos
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">{langLabel}</span>
                <span className="px-3 py-1 text-xs font-medium bg-white/20 rounded-full">{levelLabel}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">{course.title}</h1>
              <p className="text-lg text-white/80">{course.shortDescription}</p>

              <div className="flex flex-wrap gap-4 text-sm text-white/70">
                {course.totalLessons > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> {course.totalLessons} lecciones
                  </span>
                )}
                {course.totalDuration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {Math.floor(course.totalDuration / 60)}h {course.totalDuration % 60}m
                  </span>
                )}
                {course.rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4" /> {course.rating.toFixed(1)} ({course.reviewCount})
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {course.enrolledCount || 0} estudiantes
                </span>
              </div>

              {course.tutor && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {course.tutor.firstName?.[0]}{course.tutor.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {course.tutor.firstName} {course.tutor.lastName}
                    </p>
                    <p className="text-xs text-white/60">Instructor</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:w-80">
              <div className="bg-white dark:bg-surface-dark-elevated rounded-2xl p-6 shadow-card text-gray-900 dark:text-white space-y-4 sticky top-24">
                <div className="text-3xl font-bold text-primary-600">
                  ${course.price?.toLocaleString?.() || course.price || 0}
                </div>

                    <Suspense fallback={<Button variant="primary" size="lg" fullWidth disabled>Cargando...</Button>}>
                      <EnrollButton courseId={course._id} />
                    </Suspense>

                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium">Este curso incluye:</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-primary-600" /> {course.totalLessons || 0} lecciones
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary-600" /> Nivel: {levelLabel}
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary-600" /> Acceso de por vida
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Descripción</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
            {course.description}
          </p>
        </div>

        {course.modules && course.modules.length > 0 && (
          <div className="max-w-3xl mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contenido del curso</h2>
            <div className="space-y-4">
              {course.modules.map((mod: CourseModule, idx: number) => (
                <div
                  key={mod._id}
                  className="bg-white dark:bg-surface-dark-elevated rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Módulo {idx + 1}: {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{mod.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {mod.lessons?.length || 0} lecciones
                    </span>
                  </div>
                  {mod.lessons && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {mod.lessons.map((lesson: CourseLesson) => (
                        <div
                          key={lesson._id}
                          className="px-6 py-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {lesson.type === 'video' ? (
                            <Play className="w-4 h-4 text-primary-600" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-primary-600" />
                          )}
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.duration && <span>{lesson.duration}min</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}