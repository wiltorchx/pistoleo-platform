# FASES DEL PROYECTO - PISTOLEO PLATFORM

**Fecha de inicio:** 2026-06-12  
**Última actualización:** 2026-06-12  
**Estado actual:** FASE 2 COMPLETADA - Iniciando FASE 3 (Productos, Ubicaciones, Categorías)

---

## 🎯 HANDOFF PARA PRÓXIMA SESIÓN OPENCODE

### ¿DÓNDE QUEDAMOS?
- **Fase 0**: ✅ Análisis y planificación completa
- **Fase 1**: ✅ BD Migración 00004 aplicada (8 tablas inventario_*)
- **Fase 2**: ✅ Estructura carpetas + Layout + Dashboard completados
- **Fase 3**: 🔄 **PRÓXIMO** - Productos, Ubicaciones, Categorías (CRUD)

### QUÉ HACER AHORA (ORDEN DE PRIORIDAD)

1. **Crear APIs de Productos** (`app/inventario/api/productos/`)
   - `route.ts` - GET list + POST crear
   - `[id]/route.ts` - GET, PATCH, DELETE
   - `importar/route.ts` - POST import Excel/CSV

2. **Crear UI Productos**
   - `app/inventario/productos/page.tsx` - Lista con filtros, búsqueda, paginación
   - `app/inventario/productos/nuevo/page.tsx` - Formulario crear
   - `app/inventario/productos/[id]/page.tsx` - Detalle + kardex

3. **Crear APIs Ubicaciones** (`app/inventario/api/ubicaciones/`)
   - `route.ts` - GET árbol, POST crear
   - `[id]/route.ts` - GET, PATCH, DELETE, GET stock

4. **Crear UI Ubicaciones** (árbol recursivo)
   - `app/inventario/ubicaciones/page.tsx`
   - `app/inventario/ubicaciones/[id]/page.tsx`

5. **Crear APIs + UI Categorías** (simple CRUD)

### COMANDOS PARA EMPEZAR
```bash
cd pistoleo-platform
npm run dev          # Verificar que compila (puerto 3000/3001)
# Abrir http://localhost:3000/inventario
# Empezar con app/inventario/api/productos/route.ts
```

### ARCHIVOS CLAVE YA CREADOS
- `supabase/migrations/00004_inventario_schema.sql` ✅ (aplicada en Supabase)
- `types/inventario.ts` ✅ (interfaces completas)
- `app/inventario/layout.tsx` ✅ (sidebar + navegación)
- `app/inventario/page.tsx` ✅ (dashboard KPIs + alertas + movimientos)
- `app/inventario/api/` estructura completa ✅

---

## RESUMEN EJECUTIVO

Separar la funcionalidad actual en **dos módulos independientes**:
- **Pistoleo** = Escaneo + Comparación (cámara, códigos, sobrantes, historial, reportes)
- **Inventario** = Gestión de Stock (CRUD productos, ubicaciones, ajustes, reportes, transferencias)

---

## FASE 0: SETUP Y DOCUMENTACIÓN BASE ✅ COMPLETADA

### 0.1 Análisis de arquitectura actual
- [x] Revisión BD existente (pistoleo_batches, pistoleo_inventory, pistoleo_scans)
- [x] Revisión APIs actuales (/api/pistoleo/*, /api/pistoleo/batches, /api/pistoleo/inventory/[id])
- [x] Revisión UI actual (Dashboard, Scanner, Wizard, Review)
- [x] Identificación de código compartido (comparisonEngine, pdfParser, excelParser)

### 0.2 Documentación del plan global
- [x] Creación de PHASES.md (este archivo)
- [x] Definición de estructura de carpetas nueva
- [x] Definición de migración BD (00004_inventario_schema.sql)
- [x] Definición de lógica de negocio (lib/inventario/*)
- [x] Definición de integración Pistoleo → Inventario
- [x] Checklist de entregables por módulo
- [x] Estimación de tiempo: ~16.5 días

---

## FASE 1: BASE DE DATOS - MIGRACIÓN INVENTARIO ✅ COMPLETADA (2026-06-12)

### 1.1 Crear migración 00004_inventario_schema.sql
- [x] Tabla `inventario_productos` (productos maestros)
- [x] Tabla `inventario_categorias`
- [x] Tabla `inventario_ubicaciones` (jerárquica recursiva)
- [x] Tabla `inventario_movimientos` (kardex completo)
- [x] Tabla `inventario_conteos` + `inventario_conteo_items`
- [x] Tabla `inventario_transferencias` + `inventario_transferencia_items`
- [x] Índices críticos para performance
- [x] Foreign keys y constraints
- [x] Triggers para updated_at automático
- [x] Trigger para actualizar stock automáticamente en movimientos
- [x] Función get_stock_by_ubicacion (recursiva)

### 1.2 Ejecutar migración en Supabase (local + producción)
- [x] Local/Desarrollo (aplicada 2026-06-12)
- [x] Railway/Producción (aplicada 2026-06-12)

### 1.3 Tipos TypeScript para nuevas tablas
- [x] `types/inventario.ts` con interfaces completas

---

## FASE 2: ESTRUCTURA DE CARPETAS Y LAYOUT ✅ COMPLETADA (2026-06-12)

### 2.1 Crear estructura de directorios
- [x] Estructura completa de carpetas creada en `app/inventario/`
- [x] Layout principal con sidebar navegable (`app/inventario/layout.tsx`)
- [x] Dashboard con KPIs, alertas, movimientos recientes, acciones rápidas (`app/inventario/page.tsx`)
- [x] Estructura de APIs creada en `app/inventario/api/`

### 2.2 Layout y navegación
- [x] Sidebar colapsible con iconos y nombres
- [x] Header móvil con botón hamburguesa
- [x] Navegación: Dashboard, Productos, Ubicaciones, Categorías, Movimientos, Conteos, Transferencias, Reportes
- [x] Responsive (mobile drawer + desktop fixed)

---

## FASE 3: INVENTARIO - PRODUCTOS, UBICACIONES, CATEGORÍAS 🔄 EN PROGRESO (PRÓXIMO PASO)

### 3.1 Productos (CRUD completo) ⬜ PENDIENTE
- [ ] API: GET list (paginación, filtros, búsqueda), POST crear
- [ ] API: GET by id, PATCH actualizar, DELETE
- [ ] API: Importar Excel/CSV masivo con validación
- [ ] UI: Lista con tabla, filtros laterales, búsqueda
- [ ] UI: Formulario crear/editar (modal o página)
- [ ] UI: Página detalle con kardex resumido

### 3.2 Ubicaciones (Jerárquicas) ⬜ PENDIENTE
- [ ] API: GET árbol completo, POST crear
- [ ] API: GET by id, PATCH, DELETE
- [ ] API: GET stock por ubicación
- [ ] UI: Árbol visual (recursivo) con drag-drop opcional
- [ ] UI: Detalle ubicación con productos en stock

### 3.3 Categorías ⬜ PENDIENTE
- [ ] API: CRUD simple
- [ ] UI: Gestión en página o modal
│   │   ├── page.tsx
│   │   ├── nuevo/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── resumen/page.tsx
│   ├── reportes/
│   │   ├── page.tsx
│   │   ├── stock/page.tsx
│   │   ├── valorizado/page.tsx
│   │   ├── kardex/page.tsx
│   │   ├── rotacion/page.tsx
│   │   └── merma/page.tsx
│   └── api/
│       ├── productos/
│       ├── ubicaciones/
│       ├── categorias/
│       ├── movimientos/
│       ├── conteos/
│       ├── transferencias/
│       └── reportes/
```

### 2.2 Layout y navegación
- [ ] Sidebar actualizado con Pistoleo e Inventario separados
- [ ] Layout base para cada módulo
- [ ] Breadcrumbs consistentes

---

## FASE 3: INVENTARIO - PRODUCTOS, UBICACIONES, CATEGORÍAS ⬜ PENDIENTE

### 3.1 Productos (CRUD completo)
- [ ] API: GET list (paginación, filtros, búsqueda), POST crear
- [ ] API: GET by id, PATCH actualizar, DELETE
- [ ] API: Importar Excel/CSV masivo con validación
- [ ] UI: Lista con tabla, filtros laterales, búsqueda
- [ ] UI: Formulario crear/editar (modal o página)
- [ ] UI: Página detalle con kardex resumido

### 3.2 Ubicaciones (Jerárquicas)
- [ ] API: GET árbol completo, POST crear
- [ ] API: GET by id, PATCH, DELETE
- [ ] API: GET stock por ubicación
- [ ] UI: Árbol visual (recursivo) con drag-drop opcional
- [ ] UI: Detalle ubicación con productos en stock

### 3.3 Categorías
- [ ] API: CRUD simple
- [ ] UI: Gestión en página o modal

---

## FASE 4: INVENTARIO - MOVIMIENTOS (KARDEX) ⬜ PENDIENTE

### 4.1 Motor de stock (lib/inventario/stockEngine.ts)
- [ ] Calcular stock actual por producto/ubicación
- [ ] Validar movimientos (stock suficiente para salidas)
- [ ] Costo promedio ponderado (configurable FIFO/LIFO)
- [ ] Generar movimiento automático al aprobar conteos/transferencias

### 4.2 Tipos de movimiento
- [ ] **Entrada** (compra, devolución, inventario inicial)
- [ ] **Salida** (venta, consumo interno, merma)
- [ ] **Ajuste +** / **Ajuste -**
- [ ] **Transferencia** (origen + destino en una transacción)

### 4.3 API Movimientos
- [ ] GET list (filtros: producto, ubicación, tipo, fecha, usuario)
- [ ] POST crear (validaciones + actualización stock)
- [ ] Kardex por producto (GET /api/inventario/productos/[id]/kardex)

### 4.4 UI Kardex
- [ ] Página movimientos con tabla + filtros avanzados
- [ ] Formularios: Entrada, Salida, Ajuste (modales)
- [ ] Detalle producto con historial completo

---

## FASE 5: INVENTARIO - CONTEOS FÍSICOS ⬜ PENDIENTE

### 5.1 Flujo completo
- [ ] **Crear conteo**: Filtros (ubicación, categoría), genera items con stock_sistema
- [ ] **Hoja de conteo**: Tabla editable (stock_fisico), guardado automático
- [ ] **Resumen**: Diferencias calculadas, totales, aprobado/rechazado
- [ ] **Aprobar**: Genera movimientos tipo 'ajuste_positivo/negativo' con referencia al conteo

### 5.2 API Conteos
- [ ] GET list, POST crear, GET by id, PATCH estado
- [ ] GET items, POST actualizar stock_fisico (batch)
- [ ] POST aprobar → genera movimientos

### 5.3 UI Conteos
- [ ] Lista con estados (borrador, en_progreso, finalizado, aprobado, rechazado)
- [ ] Hoja de conteo: tabla grande, búsqueda, atajos teclado
- [ ] Resumen visual: verde/rojo diferencias, botón aprobar

---

## FASE 6: INVENTARIO - TRANSFERENCIAS ⬜ PENDIENTE

### 6.1 Flujo
- [ ] **Crear**: Origen, destino, items solicitados
- [ ] **Enviar**: Marca enviada, reduce stock origen (reserva)
- [ ] **Recibir**: Parcial/total, aumenta stock destino, cierra transferencia
- [ ] **Cancelar**: Libera reservas

### 6.2 API Transferencias
- [ ] GET list, POST crear, GET by id, PATCH estado
- [ ] POST enviar, POST recibir (parcial/total)

### 6.3 UI Transferencias
- [ ] Lista con estados, formulario crear, detalle con recibir

---

## FASE 7: INVENTARIO - REPORTES (5 TIPOS) ⬜ PENDIENTE

### 7.1 Reportes a implementar
| Reporte | Descripción | Columnas clave |
|---------|-------------|----------------|
| **Stock Actual** | Stock por producto/ubicación | Producto, Ubic, Stock, Min, Max, Estado |
| **Valorizado** | Valor stock (costo/venta) | Producto, Stock, Costo Unit, Total Costo, Total Venta, Margen |
| **Kardex** | Movimientos por producto | Fecha, Tipo, Doc Ref, Cant, Stock Ant, Stock Nvo, Costo, Saldo |
| **Rotación/ABC** | Análisis ABC + días stock | Producto, Ventas, Stock, Días Stock, Clase ABC |
| **Mermas/Pérdidas** | Ajustes negativos + mermas | Fecha, Producto, Tipo, Cant, Costo, Usuario, Observ |

### 7.2 Motor de reportes (lib/inventario/reportEngine.ts)
- [ ] Generar Excel con ExcelJS (estilos, totales, filtros)
- [ ] Parámetros: fechas, ubicación, categoría, producto

### 7.3 API y UI Reportes
- [ ] GET /api/inventario/reportes/{tipo} → descarga Excel
- [ ] Hub visual con cards para cada reporte + parámetros

---

## FASE 8: PISTOLEO - REFINAMIENTO Y FUNCIONALIDADES FALTANTES ⬜ PENDIENTE

### 8.1 Funcionalidades a completar
- [ ] **Modo offline**: IndexedDB + sync posterior (ya existe sync.ts base)
- [ ] **Historial escaneos**: Ver quién escaneó qué y cuándo
- [ ] **Multi-usuario mismo batch**: Lock optimista, ver escaneos otros
- [ ] **Feedback háptico/sonido**: Al escanear exitoso/error
- [ ] **Etiquetas QR**: Generar para ubicaciones/productos
- [ ] **Sobrantes (Over)**: Ya visible - confirmar UX correcta

### 8.2 API Historial
- [ ] GET /api/pistoleo/[id]/historial → lista escaneos con usuario, timestamp

### 8.3 UI Scanner
- [ ] Panel "Últimos escaneos" en tiempo real
- [ ] Filtro por usuario en historial
- [ ] Indicador modo offline/online

---

## FASE 9: INTEGRACIÓN PISTOLEO → INVENTARIO ⬜ PENDIENTE

### 9.1 Punto de contacto único
```
Pistoleo Batch (completado) 
    │
    └─> Botón "Sincronizar con Inventario"
         │
         └─> POST /api/inventario/sincronizar-pistoleo
              │
              ├─> Match por UPC/código_barras
              ├─> Si existe → actualiza stock_actual (movimiento 'entrada' o 'ajuste_positivo')
              └─> Si no existe → crea producto (opcional, con confirmación)
              │
              └─> lote_pistoleo_id = batch.id (trazabilidad)
```

### 9.2 API Sincronización
- [ ] POST /api/inventario/sincronizar-pistoleo
- [ ] Validaciones, preview antes de confirmar
- [ ] Log de sincronizaciones realizadas

### 9.3 UI Integración
- [ ] Botón en batch completado (Pistoleo)
- [ ] Modal preview: "Se actualizarán X productos, Y nuevos"
- [ ] Historial de sincronizaciones

---

## FASE 10: PERMISOS, PULIDO Y TESTING ⬜ PENDIENTE

### 10.1 Sistema de permisos granular
| Acción | Admin | Encargado Bodega | Operador Pistoleo | Solo Lectura |
|--------|-------|------------------|-------------------|--------------|
| Ver Dashboard | ✅ | ✅ | ✅ | ✅ |
| Crear/Editar Productos | ✅ | ✅ | ❌ | ❌ |
| Registrar Movimientos | ✅ | ✅ | ❌ | ❌ |
| Aprobar Conteos | ✅ | ✅ | ❌ | ❌ |
| Transferencias | ✅ | ✅ | ❌ | ❌ |
| Reportes | ✅ | ✅ | ✅ | ✅ |
| Pistoleo (Escanear) | ✅ | ✅ | ✅ | ❌ |
| Sincronizar Pistoleo | ✅ | ✅ | ❌ | ❌ |

### 10.2 UI/UX Polish
- [ ] Loading states, skeletons, empty states
- [ ] Toast notifications consistentes
- [ ] Confirmaciones destructivas
- [ ] Responsive mobile (tablas colapsables)
- [ ] Dark mode consistente

### 10.3 Testing
- [ ] Unit tests: stockEngine, kardexEngine, valuationEngine
- [ ] Integration tests: APIs críticas
- [ ] E2E: Flujos principales (conteo completo, transferencia, sincronización)

---

## REGISTRO DE AVANCE POR SESIÓN

| Fecha | Sesión | Fases trabajadas | Avance | Próximos pasos | Notas |
|-------|--------|------------------|--------|----------------|-------|
| 2026-06-12 | 1 | 0 | 100% | Fase 1 | Análisis completo, plan documentado |
| 2026-06-12 | 2 | 1 | 100% | Fase 2 | Migración 00004 aplicada, 8 tablas creadas, tipos TS generados |
| 2026-06-12 | 3 | 2 | 100% | Fase 3 | Layout + Dashboard Inventario completados, APIs estructura lista |

---

## COMANDOS ÚTILES PARA DESARROLLO

```bash
# Desarrollo
npm run dev                    # Puerto 3000/3001
npm run lint                   # ESLint
npx tsc --noEmit              # TypeScript check

# Base de datos
npx supabase migration new    # Nueva migración
npx supabase db push          # Aplicar migraciones

# Git
git add -A && git commit -m "msg"
git push origin master        # Despliega en Railway automáticamente
```

---

## NOTAS PARA CONTINUAR EN OTRA PC

1. **Clonar repo:** `git clone https://github.com/wiltorchx/pistoleo-platform.git`
2. **Instalar deps:** `npm install`
3. **Configurar .env.local** con credenciales Supabase
4. **Leer PHASES.md** para saber estado actual
5. **Ejecutar:** `npm run dev`
6. **Continuar desde la fase marcada como ⬜ PENDIENTE**

---

## DECISIONES TÉCNICAS CONFIRMADAS

| Tema | Decisión | Fecha |
|------|----------|-------|
| Valorización stock | Promedio ponderado (configurable FIFO/LIFO) | 2026-06-12 |
| Ubicaciones | Jerarquía recursiva dinámica (no niveles fijos) | 2026-06-12 |
| Conteos | Generan movimientos auditables (trazabilidad) | 2026-06-12 |
| Transferencias | Con aprobación (control) | 2026-06-12 |
| Multi-bodega | Sí (ubicaciones recursivas lo permiten) | 2026-06-12 |
| Pistoleo→Inventario | Manual con botón + preview | 2026-06-12 |
| Permisos | Por acción (CRUD granular) | 2026-06-12 |
| Modo industrial | ELIMINADO (no se necesita) | 2026-06-12 |

---

**Última modificación:** 2026-06-12 - Fase 1 completada (migración 00004, 8 tablas, tipos TS). Iniciando Fase 2: Estructura de carpetas.