export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light-muted dark:bg-surface-dark">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}
