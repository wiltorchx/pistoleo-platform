'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import {
  ClipboardList, Loader2, Upload, FileText, AlertCircle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, FileSpreadsheet
} from 'lucide-react';

type ImportMode = 'manual' | 'archivo';

interface ParsedItemPreview {
  codigo: string;
  descripcion: string;
  cantidad: number;
  coincide: boolean;
}

export default function NuevoConteoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>('manual');
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedItemPreview[] | null>(null);
  const [stats, setStats] = useState<{
    totalArchivo: number;
    totalCoincidencias: number;
    totalSinCoincidencia: number;
  } | null>(null);
  const [advertencia, setAdvertencia] = useState('');
  const [showUnmatched, setShowUnmatched] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
    setStats(null);
    setAdvertencia('');
    setError('');
    if (!nombre) {
      const baseName = f.name.replace(/\.[^/.]+$/, '');
      setNombre(`Conteo desde ${baseName}`);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/inventario/api/conteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(`/inventario/conteos/${data.id}`);
    } catch { setError('Error al crear conteo'); }
    finally { setSubmitting(false); }
  };

  const handlePreview = async () => {
    if (!file) return;
    setParsing(true);
    setError('');
    setPreview(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('nombre', nombre.trim());

      const res = await fetch('/inventario/api/conteos/import', {
        method: 'POST',
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.unmatchedItems) {
          const unmatchedPreview: ParsedItemPreview[] = data.unmatchedItems.map((u: { codigo: string; descripcion: string; cantidad: number }) => ({
            ...u, coincide: false,
          }));
          setPreview(unmatchedPreview);
          setStats({ totalArchivo: data.matched + data.unmatched, totalCoincidencias: data.matched, totalSinCoincidencia: data.unmatched });
          setAdvertencia(data.error || '');
          return;
        }
        setError(data.error || 'Error al procesar archivo');
        return;
      }

      const combinedPreview: ParsedItemPreview[] = [
        ...data.sinCoincidencia?.map((u: { codigo: string; descripcion: string; cantidad: number }) => ({
          ...u, coincide: false,
        })) || [],
      ];
      const matchedCount = data.resumen.totalCoincidencias - (data.sinCoincidencia?.length || 0);
      for (let i = 0; i < Math.min(matchedCount, 5); i++) {
        combinedPreview.push({ codigo: `...`, descripcion: `+ ${Math.max(0, matchedCount - i)} más`, cantidad: 0, coincide: true });
      }

      setPreview(combinedPreview.slice(0, 10));
      setStats(data.resumen);
      setAdvertencia(data.advertencia || '');

      router.push(`/inventario/conteos/${data.conteo.id}`);
    } catch (e) {
      setError('Error al procesar el archivo');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Nuevo Conteo Físico</h1>
        <p className="text-neutral-500 mt-1">Cree un conteo manualmente o importando un archivo</p>
      </div>

      <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          <ClipboardList className="w-4 h-4 inline mr-1.5" />
          Manual
        </button>
        <button
          onClick={() => setMode('archivo')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'archivo' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          <Upload className="w-4 h-4 inline mr-1.5" />
          Importar archivo
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {advertencia && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-yellow-700 dark:text-yellow-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{advertencia}</span>
        </div>
      )}

      {mode === 'manual' ? (
        <form onSubmit={handleSubmitManual} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre del Conteo *</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Conteo Mensual Junio 2026" required />
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Se cargarán todos los productos activos para el conteo. Puede ajustar cantidades durante el proceso.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
              {submitting ? 'Creando...' : 'Crear Conteo'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre del Conteo</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Conteo desde Reporte de Inventario" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Archivo (PDF, Excel o CSV)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
            >
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {preview && preview.length > 0 && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Vista previa ({stats?.totalCoincidencias || 0} coincidencias, {stats?.totalSinCoincidencia || 0} sin coincidencia)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="p-2 text-left text-xs font-semibold text-neutral-500 uppercase">Código</th>
                      <th className="p-2 text-left text-xs font-semibold text-neutral-500 uppercase">Descripción</th>
                      <th className="p-2 text-right text-xs font-semibold text-neutral-500 uppercase">Cantidad</th>
                      <th className="p-2 text-center text-xs font-semibold text-neutral-500 uppercase w-20">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {preview.map((item, idx) => (
                      <tr key={idx} className={item.coincide ? '' : 'bg-red-50/50 dark:bg-red-900/10'}>
                        <td className="p-2 font-mono text-xs">{item.codigo}</td>
                        <td className="p-2 text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">{item.descripcion}</td>
                        <td className="p-2 text-right font-mono text-xs">{item.cantidad}</td>
                        <td className="p-2 text-center">
                          {item.coincide ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Los códigos del archivo se buscarán en el inventario. Los items que coincidan se agregarán
              con su conteo físico pre-cargado. Los que no coincidan se mostrarán como advertencia.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!file || parsing}
              onClick={handlePreview}
              className="gap-2"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {parsing ? 'Procesando...' : 'Importar y crear conteo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
