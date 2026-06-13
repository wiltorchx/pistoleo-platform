'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { ArrowLeft, Upload, FileDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export default function ImportarProductosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [columnMapping, setColumnMapping] = useState({
    codigo: 'codigo',
    nombre: 'nombre',
    descripcion: 'descripcion',
    codigo_barras: 'codigo_barras',
    unidad_medida: 'unidad_medida',
    stock_minimo: 'stock_minimo',
    stock_maximo: 'stock_maximo',
    costo_promedio: 'costo_promedio',
    precio_venta: 'precio_venta',
    categoria: 'categoria',
    ubicacion: 'ubicacion',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      const res = await fetch('/inventario/api/productos/importar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  const handleMappingChange = (field: string, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Importar Productos</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Importe productos desde un archivo Excel (.xlsx) o CSV</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">1. Seleccione el archivo</h2>
          <p className="text-sm text-neutral-500 mb-4">Formatos aceptados: .xlsx, .xls, .csv</p>
          <div
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">
              {file ? file.name : 'Haga clic para seleccionar un archivo'}
            </p>
            {file && (
              <p className="text-xs text-neutral-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">2. Mapeo de columnas</h2>
          <p className="text-sm text-neutral-500 mb-4">Indique qué columna del archivo corresponde a cada campo</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(columnMapping).map(([field, value]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 capitalize">
                  {field.replace(/_/g, ' ')}
                </label>
                <input
                  value={value}
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  placeholder="Nombre de columna"
                />
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          className="gap-2 w-full"
          disabled={!file || importing}
          onClick={handleImport}
        >
          {importing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {importing ? 'Importando...' : 'Importar Productos'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">Error</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">Importación completada</p>
                <ul className="text-sm text-green-600 dark:text-green-400 mt-1 space-y-0.5">
                  <li>Creados: {result.created}</li>
                  <li>Omitidos (ya existían): {result.skipped}</li>
                  {result.errors.length > 0 && (
                    <li>
                      Errores: {result.errors.length}
                      <ul className="ml-4 list-disc">
                        {result.errors.slice(0, 5).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
