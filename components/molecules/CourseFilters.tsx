export function CourseFilters({
  language,
  level,
  search,
  sort,
  onLanguageChange,
  onLevelChange,
  onSearchChange,
  onSortChange,
}: {
  language: string;
  level: string;
  search: string;
  sort: string;
  onLanguageChange: (val: string) => void;
  onLevelChange: (val: string) => void;
  onSearchChange: (val: string) => void;
  onSortChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Buscar cursos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-sm cursor-pointer"
        >
          <option value="all">Todos los idiomas</option>
          <option value="english">Inglés</option>
          <option value="spanish">Español</option>
        </select>

        <select
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-sm cursor-pointer"
        >
          <option value="all">Todos los niveles</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-sm cursor-pointer"
        >
          <option value="newest">Más recientes</option>
          <option value="popular">Más populares</option>
          <option value="priceAsc">Precio: menor a mayor</option>
          <option value="priceDesc">Precio: mayor a menor</option>
          <option value="rating">Mejor valorados</option>
        </select>
      </div>
    </div>
  );
}