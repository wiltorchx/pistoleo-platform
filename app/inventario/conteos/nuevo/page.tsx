'use client';

import React, { useState, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Loader2, Upload, FileText, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function NuevoConteoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<{ codigo: string; descripcion: string; cantidad: number }[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setError('');
    if (!nombre) {
      const baseName = f.name.replace(/\.[^/.]+$/, '');
      setNombre(`Conteo desde ${baseName}`);
    }
    showPreview(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setParsing(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('nombre', nombre.trim());

      const res = await fetch('/inventario/api/conteos/import', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar archivo');
        return;
      }

      router.push(`/inventario/conteos/${data.conteo.id}`);
    } catch {
      setError('Error al procesar el archivo');
    } finally {
      setParsing(false);
    }
  };

  const showPreview = async (f: File) => {
    if (!f) return;
    if (f.name.endsWith('.csv') || f.type === 'text/csv' || f.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return;
        const previewItems = lines.slice(1, 6).map(line => {
          const cols = line.split(';');
          return { codigo: cols[0]?.trim() || '', descripcion: cols[1]?.trim() || '', cantidad: parseInt(cols[2]) || 0 };
        });
        setPreview(previewItems);
      };
      reader.readAsText(f);
      return;
    }
    setPreview(null);
    const body = new FormData();
    body.append('file', f);
    try {
      const res = await fetch('/inventario/api/conteos/preview', { method: 'POST', body });
      const data = await res.json();
      if (res.ok) {
        setPreview(data.preview);
      }
    } catch {
      setPreview([{ codigo: '...', descripcion: 'Error al obtener vista previa', cantidad: 0 }]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Nuevo Conteo Físico</h1>
        <p className="text-neutral-500 mt-1">Importe un archivo con los productos a contar</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre del Conteo</label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Conteo Mensual Junio 2026" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Archivo con lista de productos (PDF, Excel o CSV)
          </label>
          <label className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors block">
            {file ? (
              <div className="space-y-2">
                {file.name.endsWith('.pdf') ? (
                  <FileText className="w-10 h-10 mx-auto text-red-500" />
                ) : (
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-green-500" />
                )}
                <p className="font-medium text-neutral-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-neutral-400" />
                <p className="font-medium text-neutral-600 dark:text-neutral-400">Selecciona un archivo</p>
                <p className="text-sm text-neutral-500">Soporta PDF, Excel (.xlsx) o CSV</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </label>
        </div>

        {preview && preview.length > 0 && (
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Vista previa</span>
              <span className="text-xs text-neutral-500">Mostrando hasta 5 items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="p-2 text-left text-xs font-semibold text-neutral-500 uppercase">Código</th>
                    <th className="p-2 text-left text-xs font-semibold text-neutral-500 uppercase">Descripción</th>
                    <th className="p-2 text-right text-xs font-semibold text-neutral-500 uppercase">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {preview.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono text-xs text-neutral-900 dark:text-white">{item.codigo}</td>
                      <td className="p-2 text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">{item.descripcion}</td>
                      <td className="p-2 text-right font-mono text-xs">{item.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            El archivo debe contener los códigos y cantidades esperadas de los productos a contar. 
            Los items se importarán directamente como productos del conteo.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
          <Button variant="primary" disabled={!file || parsing} onClick={handleImport} className="gap-2">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {parsing ? 'Importando...' : 'Importar y crear conteo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
