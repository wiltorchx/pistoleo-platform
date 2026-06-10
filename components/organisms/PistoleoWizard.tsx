import React from 'react';
import { Button } from '@/components/atoms/Button';
import { t } from '@/lib/pistoleo/i18n';

interface PistoleoWizardProps {
  onClose: () => void;
  onComplete: (batchId: string) => void;
}

export const PistoleoWizard = ({ onClose, onComplete }: PistoleoWizardProps) => {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({ name: '', batchId: '' });
  const [isLoading, setIsLoading] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleStep1Next = async () => {
    if (!formData.name) return;
    setIsLoading(true);
    try {
      const body = new FormData();
      body.append('action', 'create-batch');
      body.append('name', formData.name);
      body.append('userId', 'admin-id'); // Simplified for now, will use auth context later

      const res = await fetch('/api/pistoleo', { method: 'POST', body });
      const batch = await res.json();
      setFormData(prev => ({ ...prev, batchId: batch._id }));
      setStep(2);
    } catch (_e) {
      console.error(_e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    try {
      const body = new FormData();
      body.append('action', 'upload-pdf');
      body.append('batchId', formData.batchId);
      body.append('file', file);

      const res = await fetch('/api/pistoleo', { method: 'POST', body });
      if (res.ok) {
        setImportStatus('success');
      } else {
        setImportStatus('error');
      }
    } catch {
      setImportStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('wizard.title')}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('wizard.step1.title')}</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t('wizard.step1.nameLabel')}</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-primary-600 outline-none"
                    placeholder={t('wizard.step1.namePlaceholder')}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={isLoading || !formData.name} 
                onClick={handleStep1Next}
              >
                {isLoading ? '...' : t('wizard.step1.next')}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('wizard.step2.title')}</h3>
                <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 text-center space-y-4">
                  <input 
                    type="file" 
                    id="pdf-upload" 
                    className="hidden" 
                    accept=".pdf" 
                    onChange={handlePdfUpload}
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer block">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="font-medium">{t('wizard.step2.uploadLabel')}</p>
                    <p className="text-sm text-neutral-500">{t('wizard.step2.uploadHint')}</p>
                  </label>
                </div>
                
                {importStatus === 'loading' && <p className="text-center mt-4 text-primary-600 animate-pulse">{t('wizard.step2.processing')}</p>}
                {importStatus === 'success' && <p className="text-center mt-4 text-green-600 font-medium">{t('wizard.step2.imported')}</p>}
                {importStatus === 'error' && <p className="text-center mt-4 text-red-600 font-medium">{t('wizard.step2.error')}</p>}
              </div>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>{t('wizard.step2.back')}</Button>
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  disabled={importStatus !== 'success'} 
                  onClick={() => setStep(3)}
                >
                  {t('wizard.step2.confirm')}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-4">
              <div className="text-5xl">✅</div>
              <div>
                <h3 className="text-lg font-semibold">{t('wizard.step3.title')}</h3>
                <p className="text-neutral-500 mt-2">{t('wizard.step3.confirmMsg')}</p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => onComplete(formData.batchId)}
              >
                {t('wizard.step3.startScanning')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
