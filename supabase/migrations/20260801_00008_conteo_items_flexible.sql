ALTER TABLE inventario_conteo_items
  ALTER COLUMN producto_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS codigo TEXT,
  ADD COLUMN IF NOT EXISTS nombre TEXT;

DROP INDEX IF EXISTS idx_inv_conteo_items_producto;
CREATE INDEX idx_inv_conteo_items_codigo ON inventario_conteo_items(conteo_id, codigo);
