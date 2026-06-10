'use client';

import { useState, useEffect } from 'react';
import { TutorCard } from '@/components/molecules/TutorCard';
import { GraduationCap, Search } from 'lucide-react';

interface TutorItem {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  hourlyRate?: number;
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      fetch(`/api/tutors?${params}`)
        .then((res) => res.json())
        .then((data) => setTutors(data.tutors || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen bg-surface-light-muted dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Nuestros Tutores</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Instructores certificados de inglés y español</p>
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tutores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-surface-dark-elevated rounded-2xl shadow-card p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron tutores</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <TutorCard key={tutor._id} {...tutor} languages={[]} specialties={[]} rating={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}