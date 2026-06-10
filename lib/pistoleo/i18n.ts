export const pistoleoTranslations = {
  en: {
    dashboard: {
      title: 'Scanning Dashboard',
      subtitle: 'Manage and monitor your merchandise scanning sessions',
      newBatch: 'Create New Batch',
      noBatches: 'No scanning sessions found. Start by creating a new one!',
      status: {
        pending: 'Pending',
        in_progress: 'In Progress',
        completed: 'Completed',
      },
      columns: {
        name: 'Batch Name',
        status: 'Status',
        date: 'Created At',
        actions: 'Actions',
      },
    },
    wizard: {
      title: 'New Scanning Session',
      step1: {
        title: 'Session Details',
        nameLabel: 'Batch Name',
        namePlaceholder: 'e.g., Summer Inventory 2026',
        next: 'Next',
      },
      step2: {
        title: 'Import Inventory',
        uploadLabel: 'Upload Official Report (PDF)',
        uploadHint: 'PDF must contain UPCs and Quantities',
        processing: 'Parsing PDF...',
        imported: 'Items imported successfully',
        error: 'Failed to parse PDF. Please check the file format.',
        back: 'Back',
        confirm: 'Confirm & Start',
      },
      step3: {
        title: 'Session Ready',
        confirmMsg: 'Your session is ready. You can now start scanning.',
        startScanning: 'Start Scanning Now',
      },
    },
  },
  es: {
    dashboard: {
      title: 'Panel de Escaneo',
      subtitle: 'Gestiona y monitorea tus sesiones de escaneo de mercancía',
      newBatch: 'Crear Nuevo Lote',
      noBatches: 'No se encontraron sesiones. ¡Comienza creando una nueva!',
      status: {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completado',
      },
      columns: {
        name: 'Nombre del Lote',
        status: 'Estado',
        date: 'Creado el',
        actions: 'Acciones',
      },
    },
    wizard: {
      title: 'Nueva Sesión de Escaneo',
      step1: {
        title: 'Detalles de la Sesión',
        nameLabel: 'Nombre del Lote',
        namePlaceholder: 'ej., Inventario Verano 2026',
        next: 'Siguiente',
      },
      step2: {
        title: 'Importar Inventario',
        uploadLabel: 'Subir Reporte Oficial (PDF)',
        uploadHint: 'El PDF debe contener UPCs y Cantidades',
        processing: 'Procesando PDF...',
        imported: 'Artículos importados con éxito',
        error: 'Error al procesar el PDF. Verifica el formato del archivo.',
        back: 'Atrás',
        confirm: 'Confirmar e Iniciar',
      },
      step3: {
        title: 'Sesión Lista',
        confirmMsg: 'Tu sesión está lista. Ya puedes comenzar el escaneo.',
        startScanning: 'Empezar a Escanear Ahora',
      },
    },
  },
};

export function t(key: string, locale: 'en' | 'es' = 'es') {
  const keys = key.split('.');
  let result: unknown = pistoleoTranslations[locale];
  
  for (const k of keys) {
    if (typeof result === 'object' && result !== null && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return result as string;
}
