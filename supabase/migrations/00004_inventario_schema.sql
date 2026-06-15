-- Migration: Inventario Schema
-- Creates all tables for the Inventory management module
-- Separated from Pistoleo (scanning) module

-- ============================================================
-- INVENTARIO - CATEGORÍAS
-- ============================================================
CREATE TABLE inventario_categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#6366f1', -- para UI (indigo por defecto)
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_categorias_activo ON inventario_categorias(activo);

-- ============================================================
-- INVENTARIO - UBICACIONES (JERÁRQUICA RECURSIVA)
-- ============================================================
CREATE TABLE inventario_ubicaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,           -- A-01, B-02, etc
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('bodega', 'zona', 'pasillo', 'estanteria', 'nivel', 'posicion')),
  ubicacion_padre_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_ubicaciones_padre ON inventario_ubicaciones(ubicacion_padre_id);
CREATE INDEX idx_inv_ubicaciones_tipo ON inventario_ubicaciones(tipo);
CREATE INDEX idx_inv_ubicaciones_activo ON inventario_ubicaciones(activo);

-- ============================================================
-- INVENTARIO - PRODUCTOS MAESTROS
-- ============================================================
CREATE TABLE inventario_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,           -- SKU interno único
  codigo_barras TEXT UNIQUE,             -- EAN13, UPC, código de barras
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida TEXT NOT NULL DEFAULT 'UN', -- UN, KG, LT, MT, CAJ, PAQ, M, M2, M3
  categoria_id UUID REFERENCES inventario_categorias(id) ON DELETE SET NULL,
  ubicacion_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL, -- ubicación principal
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  stock_maximo INTEGER,
  costo_promedio NUMERIC(14,4) DEFAULT 0, -- 4 decimales para precisión
  precio_venta NUMERIC(14,2),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_productos_codigo ON inventario_productos(codigo);
CREATE INDEX idx_inv_productos_codigo_barras ON inventario_productos(codigo_barras);
CREATE INDEX idx_inv_productos_categoria ON inventario_productos(categoria_id);
CREATE INDEX idx_inv_productos_ubicacion ON inventario_productos(ubicacion_id);
CREATE INDEX idx_inv_productos_activo ON inventario_productos(activo);
CREATE INDEX idx_inv_productos_stock_bajo ON inventario_productos(stock_actual, stock_minimo) WHERE stock_actual <= stock_minimo AND activo;

-- ============================================================
-- INVENTARIO - MOVIMIENTOS / KARDEX
-- ============================================================
CREATE TABLE inventario_movimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'entrada',                    -- compra, devolución cliente, inventario inicial
    'salida',                     -- venta, consumo interno
    'ajuste_positivo',            -- ajuste inventario positivo
    'ajuste_negativo',            -- ajuste inventario negativo, merma
    'transferencia_origen',       -- salida por transferencia
    'transferencia_destino',      -- entrada por transferencia
    'devolucion_proveedor',       -- devolución a proveedor
    'inventario_inicial'          -- carga inicial de stock
  )),
  producto_id UUID NOT NULL REFERENCES inventario_productos(id) ON DELETE RESTRICT,
  ubicacion_origen_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL,
  ubicacion_destino_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  cantidad_anterior INTEGER NOT NULL DEFAULT 0,
  cantidad_nueva INTEGER NOT NULL DEFAULT 0,
  costo_unitario NUMERIC(14,4),
  costo_total NUMERIC(14,4) GENERATED ALWAYS AS (cantidad * COALESCE(costo_unitario, 0)) STORED,
  documento_referencia TEXT,             -- N° OC, N° Factura, N° Nota, N° Transferencia
  documento_tipo TEXT,                   -- 'compra', 'venta', 'ajuste', 'transferencia', 'inventario', 'devolucion'
  lote_pistoleo_id UUID REFERENCES pistoleo_batches(id) ON DELETE SET NULL, -- trazabilidad con pistoleo
  observaciones TEXT,
  usuario_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_movimientos_producto ON inventario_movimientos(producto_id, created_at DESC);
CREATE INDEX idx_inv_movimientos_tipo ON inventario_movimientos(tipo);
CREATE INDEX idx_inv_movimientos_ubicacion_origen ON inventario_movimientos(ubicacion_origen_id);
CREATE INDEX idx_inv_movimientos_ubicacion_destino ON inventario_movimientos(ubicacion_destino_id);
CREATE INDEX idx_inv_movimientos_lote_pistoleo ON inventario_movimientos(lote_pistoleo_id);
CREATE INDEX idx_inv_movimientos_fecha ON inventario_movimientos(created_at DESC);
CREATE INDEX idx_inv_movimientos_usuario ON inventario_movimientos(usuario_id);

-- ============================================================
-- INVENTARIO - CONTEOS FÍSICOS (INVENTARIOS PERIÓDICOS)
-- ============================================================
CREATE TABLE inventario_conteos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_progreso', 'finalizado', 'aprobado', 'rechazado')),
  ubicacion_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL, -- filtro opcional
  categoria_id UUID REFERENCES inventario_categorias(id) ON DELETE SET NULL,  -- filtro opcional
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  usuario_id UUID NOT NULL REFERENCES users(id),
  aprobado_por UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_conteos_estado ON inventario_conteos(estado);
CREATE INDEX idx_inv_conteos_ubicacion ON inventario_conteos(ubicacion_id);
CREATE INDEX idx_inv_conteos_fecha ON inventario_conteos(created_at DESC);

CREATE TABLE inventario_conteo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conteo_id UUID NOT NULL REFERENCES inventario_conteos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES inventario_productos(id) ON DELETE RESTRICT,
  ubicacion_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL,
  stock_sistema INTEGER NOT NULL DEFAULT 0,
  stock_fisico INTEGER,
  diferencia INTEGER GENERATED ALWAYS AS (COALESCE(stock_fisico, 0) - stock_sistema) STORED,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contado', 'revisado', 'aprobado')),
  observaciones TEXT,
  contado_por UUID REFERENCES users(id),
  contado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conteo_id, producto_id, ubicacion_id)
);

CREATE INDEX idx_inv_conteo_items_conteo ON inventario_conteo_items(conteo_id);
CREATE INDEX idx_inv_conteo_items_producto ON inventario_conteo_items(producto_id);
CREATE INDEX idx_inv_conteo_items_estado ON inventario_conteo_items(estado);

-- ============================================================
-- INVENTARIO - TRANSFERENCIAS ENTRE UBICACIONES
-- ============================================================
CREATE TABLE inventario_transferencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'recibida', 'cancelada')),
  ubicacion_origen_id UUID NOT NULL REFERENCES inventario_ubicaciones(id) ON DELETE RESTRICT,
  ubicacion_destino_id UUID NOT NULL REFERENCES inventario_ubicaciones(id) ON DELETE RESTRICT,
  solicitado_por UUID NOT NULL REFERENCES users(id),
  recibido_por UUID REFERENCES users(id),
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
  fecha_envio TIMESTAMPTZ,
  fecha_recepcion TIMESTAMPTZ,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (ubicacion_origen_id != ubicacion_destino_id)
);

CREATE INDEX idx_inv_transferencias_estado ON inventario_transferencias(estado);
CREATE INDEX idx_inv_transferencias_origen ON inventario_transferencias(ubicacion_origen_id);
CREATE INDEX idx_inv_transferencias_destino ON inventario_transferencias(ubicacion_destino_id);
CREATE INDEX idx_inv_transferencias_fecha ON inventario_transferencias(created_at DESC);

CREATE TABLE inventario_transferencia_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transferencia_id UUID NOT NULL REFERENCES inventario_transferencias(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES inventario_productos(id) ON DELETE RESTRICT,
  cantidad_solicitada INTEGER NOT NULL CHECK (cantidad_solicitada > 0),
  cantidad_enviada INTEGER DEFAULT 0 CHECK (cantidad_enviada >= 0),
  cantidad_recibida INTEGER DEFAULT 0 CHECK (cantidad_recibida >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'recibido', 'parcial', 'cancelado')),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transferencia_id, producto_id)
);

CREATE INDEX idx_inv_transf_items_transf ON inventario_transferencia_items(transferencia_id);
CREATE INDEX idx_inv_transf_items_producto ON inventario_transferencia_items(producto_id);
CREATE INDEX idx_inv_transf_items_estado ON inventario_transferencia_items(estado);

-- ============================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventario_categorias_updated_at BEFORE UPDATE ON inventario_categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_ubicaciones_updated_at BEFORE UPDATE ON inventario_ubicaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_productos_updated_at BEFORE UPDATE ON inventario_productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_conteos_updated_at BEFORE UPDATE ON inventario_conteos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_conteo_items_updated_at BEFORE UPDATE ON inventario_conteo_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_transferencias_updated_at BEFORE UPDATE ON inventario_transferencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_transferencia_items_updated_at BEFORE UPDATE ON inventario_transferencia_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCIÓN PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE AL INSERTAR MOVIMIENTO
-- ============================================================
CREATE OR REPLACE FUNCTION update_producto_stock()
RETURNS TRIGGER AS $$
DECLARE
  stock_delta INTEGER;
BEGIN
  -- Calcular delta de stock según tipo de movimiento
  CASE NEW.tipo
    WHEN 'entrada' THEN
      stock_delta := NEW.cantidad;
    WHEN 'salida' THEN
      stock_delta := -NEW.cantidad;
    WHEN 'ajuste_positivo' THEN
      stock_delta := NEW.cantidad;
    WHEN 'ajuste_negativo' THEN
      stock_delta := -NEW.cantidad;
    WHEN 'transferencia_origen' THEN
      stock_delta := -NEW.cantidad;
    WHEN 'transferencia_destino' THEN
      stock_delta := NEW.cantidad;
    WHEN 'devolucion_proveedor' THEN
      stock_delta := -NEW.cantidad;
    WHEN 'inventario_inicial' THEN
      stock_delta := NEW.cantidad;
    ELSE
      stock_delta := 0;
  END CASE;

  -- Actualizar stock del producto (ubicación principal)
  IF stock_delta != 0 THEN
    UPDATE inventario_productos
    SET stock_actual = stock_actual + stock_delta,
        updated_at = NOW()
    WHERE id = NEW.producto_id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_producto_stock
  AFTER INSERT ON inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION update_producto_stock();

-- ============================================================
-- FUNCIÓN PARA OBTENER STOCK POR UBICACIÓN (INCLUYE HIJOS RECURSIVOS)
-- ============================================================
CREATE OR REPLACE FUNCTION get_stock_by_ubicacion(p_ubicacion_id UUID)
RETURNS TABLE (
  producto_id UUID,
  codigo TEXT,
  nombre TEXT,
  stock_total INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ubicacion_tree AS (
    -- Ubicación raíz + todos sus descendientes
    SELECT id FROM inventario_ubicaciones WHERE id = p_ubicacion_id
    UNION ALL
    SELECT u.id FROM inventario_ubicaciones u
    INNER JOIN ubicacion_tree ut ON u.ubicacion_padre_id = ut.id
    WHERE u.activo = TRUE
  )
  SELECT 
    p.id as producto_id,
    p.codigo,
    p.nombre,
    COALESCE(SUM(
      CASE 
        WHEN m.tipo IN ('entrada', 'ajuste_positivo', 'transferencia_destino', 'inventario_inicial') THEN m.cantidad
        WHEN m.tipo IN ('salida', 'ajuste_negativo', 'transferencia_origen', 'devolucion_proveedor') THEN -m.cantidad
        ELSE 0
      END
    ), 0) as stock_total
  FROM inventario_productos p
  LEFT JOIN inventario_movimientos m ON m.producto_id = p.id 
    AND m.ubicacion_origen_id IN (SELECT id FROM ubicacion_tree)
    OR m.ubicacion_destino_id IN (SELECT id FROM ubicacion_tree)
  WHERE p.activo = TRUE
  GROUP BY p.id, p.codigo, p.nombre;
END;
$$;