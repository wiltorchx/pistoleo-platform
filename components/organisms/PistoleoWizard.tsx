"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { t } from '@/lib/pistoleo/i18n';
import * as ExcelJS from 'exceljs';
import { useInventoryWizard } from '@/components/providers/InventoryWizardProvider';

interface PistoleoWizardProps {
  onClose: () => void;
  onComplete: (batchId: string) => void;
  userId: string;
  initialBatchId?: string | null;
}

export const PistoleoWizard = ({ onClose, onComplete, userId, initialBatchId }: PistoleoWizardProps) => {
  const router = useRouter();
  const { setPendingItems, setCurrentBatchId } = useInventoryWizard();
  const initialStep = initialBatchId ? 2 : 1;
  const initialFormData = initialBatchId ? { name: '', batchId: initialBatchId } : { name: '', batchId: '' };
  
  const [step, setStep] = React.useState(initialStep);
  const [formData, setFormData] = React.useState(initialFormData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Excel Mapping State
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [availableColumns, setAvailableColumns] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState({
    upc: '',
    description: '',
    quantity: '',
  });

  const handleStep1Next = async () => {
    if (!formData.name) return;
    setIsLoading(true);
    try {
      const body = new FormData();
      body.append('action', 'create-batch');
      body.append('name', formData.name);
      body.append('userId', userId);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    if (file.name.endsWith('.pdf')) {
      // For PDFs, we now parse and redirect to a review page instead of direct import
      setImportStatus('loading');
      try {
        const body = new FormData();
        body.append('action', 'parse-pdf');
        body.append('file', file);
  
        const res = await fetch('/api/pistoleo', { method: 'POST', body });
        if (res.ok) {
          const data = await res.json();
          // Store the parsed items in context for the review page
          setPendingItems(data.items);
          setCurrentBatchId(formData.batchId);
          // Redirect to review page with batchId
          router.push(`/pistoleo/review?batchId=${formData.batchId}`);
          setImportStatus('success');
        } else {
          setImportStatus('error');
        }
      } catch {
        setImportStatus('error');
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {

      // For Excel/CSV, we need to extract columns for mapping
      try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.getWorksheet(1);
        
        if (worksheet && worksheet.getRow(1)) {
          const headers = worksheet.getRow(1).values as string[];
          // ExcelJS row values are 1-indexed and can contain nulls
          const cleanHeaders = headers.slice(1).filter(Boolean).map(String);
          setAvailableColumns(cleanHeaders);
          setStep(2.5); // Go to mapping step
        }
      } catch (err) {
        console.error('Error reading excel headers', err);
        setImportStatus('error');
      }
    }
  };

  const handleExcelImport = async () => {
    if (!selectedFile || !mapping.upc) return;
    setImportStatus('loading');
    try {
      const body = new FormData();
      body.append('action', 'upload-excel');
      body.append('batchId', formData.batchId);
      body.append('file', selectedFile);
      body.append('mapping', JSON.stringify(mapping));

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold">{t('wizard.title')}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1">✕</button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">
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
                {initialBatchId && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Re-subiendo inventario:</strong> Se reemplazará el inventario existente en este lote.
                    </p>
                  </div>
                )}
                <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 text-center space-y-4">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept=".pdf,.xlsx,.csv" 
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="font-medium">{t('wizard.step2.uploadLabel')}</p>
                    <p className="text-sm text-neutral-500">Soporta PDF, Excel o CSV</p>
                  </label>
                </div>
                
                {importStatus === 'loading' && <p className="text-center mt-4 text-primary-600 animate-pulse">{t('wizard.step2.processing')}</p>}
                {importStatus === 'success' && <p className="text-center mt-4 text-green-600 font-medium">{t('wizard.step2.imported')}</p>}
                {importStatus === 'error' && <p className="text-center mt-4 text-red-600 font-medium">{t('wizard.step2.error')}</p>}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => setStep(initialBatchId ? 1 : 1)}
                  disabled={Boolean(initialBatchId)}
                >
                  {initialBatchId ? 'No disponible' : t('wizard.step2.back')}
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  disabled={importStatus !== 'success' && step === 2} 
                  onClick={() => setStep(3)}
                >
                  {t('wizard.step2.confirm')}
                </Button>
              </div>
            </div>
          )}

          {step === 2.5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Mapeo de Columnas</h3>
                <p className="text-sm text-neutral-500 mb-6">Asocia las columnas de tu archivo con los campos del sistema.</p>
                
                <div className="space-y-4">
                  {[
                    { id: 'upc', label: 'Código / UPC' },
                    { id: 'description', label: 'Descripción / Producto' },
                    { id: 'quantity', label: 'Cantidad Esperada' },
                  ].map(field => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{field.label}</label>
                       <select 
                         className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-primary-600 outline-none"
                         value={mapping[field.id as keyof typeof mapping]}
                         onChange={e => setMapping({ ...mapping, [field.id]: e.target.value })}
                       >
                        <option value="">Seleccione una columna...</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Volver</Button>
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  disabled={!mapping.upc || !mapping.quantity} 
                  onClick={async () => {
                    await handleExcelImport();
                    if (importStatus === 'success') setStep(3);
                  }}
                >
                  {importStatus === 'loading' ? 'Procesando...' : 'Importar Datos'}
                </Button>
              </div>
              {importStatus === 'error' && <p className="text-center text-red-600 text-sm font-medium">Error al importar el archivo. Intente de nuevo.</p>}
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
