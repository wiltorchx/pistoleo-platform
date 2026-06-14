'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { PistoleoWizard } from '@/components/organisms/PistoleoWizard';
import { t } from '@/lib/pistoleo/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Batch {
  _id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function PistoleoDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialBatchId, setInitialBatchId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('clear');
    }
    return null;
  });
  const handledClearRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const res = await fetch('/api/pistoleo/batches');
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Error al cargar lotes');
        if (!Array.isArray(data)) throw new Error('Formato inválido');
        setBatches(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBatches();
  }, []);

  // Handle clear parameter - open wizard at file upload step with existing batchId
  // Handle wizard parameter - open wizard for new scan
  useEffect(() => {
    const clearBatchId = searchParams.get('clear');
    const wizardParam = searchParams.get('wizard');
    
    if (wizardParam) {
      // Open wizard for new scan
      setIsWizardOpen(true);
      handledClearRef.current = null;
    } else if (clearBatchId && user && handledClearRef.current !== clearBatchId) {
      handledClearRef.current = clearBatchId;
      setInitialBatchId(clearBatchId);
      setIsWizardOpen(true);
    }
  }, [searchParams, user]);

  return (
    <div className="page-container py-12 px-4 lg:px-0">
      <div className="flex justify-between items-end mb-12">
        <div className="space-y-2">
          <h1 className="typo-display text-4xl font-bold">{t('dashboard.title')}</h1>
          <p className="typo-subtitle text-neutral-500">{t('dashboard.subtitle')}</p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="rounded-2xl shadow-lg">
          {t('dashboard.newBatch')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-neutral-500">{t('dashboard.noBatches')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(batch => (
            <div key={batch._id} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg truncate">{batch.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  batch.status === 'completed' ? 'bg-green-100 text-green-700' : 
                  batch.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                  'bg-neutral-100 text-neutral-700'
                }`}>
                  {t(`dashboard.status.${batch.status}`)}
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                {new Date(batch.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl" 
                  onClick={() => router.push(`/pistoleo/${batch._id}`)}
                >
                  Open Session
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl px-3 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    if (confirm('¿Eliminar este lote y todos sus datos?')) {
                      await fetch(`/api/pistoleo/batches?batchId=${batch._id}`, { method: 'DELETE' });
                      setBatches(batches.filter(b => b._id !== batch._id));
                    }
                  }}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isWizardOpen && user && (
        <PistoleoWizard 
          userId={user.id}
          initialBatchId={initialBatchId}
          onClose={() => {
            setIsWizardOpen(false);
            setInitialBatchId(null);
          }} 
          onComplete={(batchId) => {
            setIsWizardOpen(false);
            setInitialBatchId(null);
            router.push(`/pistoleo/${batchId}`);
          }}
        />
      )}
    </div>
  );
}
