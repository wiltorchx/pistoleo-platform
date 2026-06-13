export type UnidadMedida = 'UN' | 'KG' | 'LT' | 'MT' | 'CAJ' | 'PAQ' | 'M' | 'M2' | 'M3' | 'ROL' | 'BLQ' | 'TUB' | 'OTRO';

export type TipoUbicacion = 'bodega' | 'zona' | 'pasillo' | 'estanteria' | 'nivel' | 'posicion';

export type TipoMovimientoInventario = 
  | 'entrada'
  | 'salida'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'transferencia_origen'
  | 'transferencia_destino'
  | 'devolucion_proveedor'
  | 'inventario_inicial';

export type TipoDocumentoInventario = 
  | 'compra'
  | 'venta'
  | 'ajuste'
  | 'transferencia'
  | 'inventario'
  | 'devolucion'
  | 'inventario_inicial';

export type EstadoConteo = 'borrador' | 'en_progreso' | 'finalizado' | 'aprobado' | 'rechazado';
export type EstadoConteoItem = 'pendiente' | 'contado' | 'revisado' | 'aprobado';
export type EstadoTransferencia = 'borrador' | 'enviada' | 'recibida' | 'cancelada';
export type EstadoTransferenciaItem = 'pendiente' | 'enviado' | 'recibido' | 'parcial' | 'cancelado';

export interface InventarioCategoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventarioUbicacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoUbicacion;
  ubicacion_padre_id: string | null;
  ubicacion_padre?: InventarioUbicacion | null;
  hijos?: InventarioUbicacion[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventarioProducto {
  id: string;
  codigo: string;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  unidad_medida: UnidadMedida;
  categoria_id: string | null;
  categoria?: InventarioCategoria | null;
  ubicacion_id: string | null;
  ubicacion?: InventarioUbicacion | null;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  costo_promedio: number;
  precio_venta: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  
  stock_bajo?: boolean;
  valor_stock?: number;
}

export interface InventarioMovimiento {
  id: string;
  tipo: TipoMovimientoInventario;
  producto_id: string;
  producto?: InventarioProducto | null;
  ubicacion_origen_id: string | null;
  ubicacion_origen?: InventarioUbicacion | null;
  ubicacion_destino_id: string | null;
  ubicacion_destino?: InventarioUbicacion | null;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  costo_unitario: number | null;
  costo_total: number;
  documento_referencia: string | null;
  documento_tipo: TipoDocumentoInventario | null;
  lote_pistoleo_id: string | null;
  observaciones: string | null;
  usuario_id: string;
  usuario?: { id: string; first_name: string; last_name: string; email: string } | null;
  created_at: string;
}

export interface InventarioConteo {
  id: string;
  nombre: string;
  estado: EstadoConteo;
  ubicacion_id: string | null;
  ubicacion?: InventarioUbicacion | null;
  categoria_id: string | null;
  categoria?: InventarioCategoria | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  usuario_id: string;
  usuario?: { id: string; first_name: string; last_name: string; email: string } | null;
  aprobado_por: string | null;
  aprobado_por_usuario?: { id: string; first_name: string; last_name: string; email: string } | null;
  created_at: string;
  updated_at: string;
  
  total_items?: number;
  items_contados?: number;
  items_con_diferencia?: number;
  total_diferencias?: number;
}

export interface InventarioConteoItem {
  id: string;
  conteo_id: string;
  producto_id: string;
  producto?: InventarioProducto | null;
  ubicacion_id: string | null;
  ubicacion?: InventarioUbicacion | null;
  stock_sistema: number;
  stock_fisico: number | null;
  diferencia: number;
  estado: EstadoConteoItem;
  observaciones: string | null;
  contado_por: string | null;
  contado_por_usuario?: { id: string; first_name: string; last_name: string; email: string } | null;
  contado_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventarioTransferencia {
  id: string;
  numero: string;
  estado: EstadoTransferencia;
  ubicacion_origen_id: string;
  ubicacion_origen?: InventarioUbicacion | null;
  ubicacion_destino_id: string;
  ubicacion_destino?: InventarioUbicacion | null;
  solicitado_por: string;
  solicitado_por_usuario?: { id: string; first_name: string; last_name: string; email: string } | null;
  recibido_por: string | null;
  recibido_por_usuario?: { id: string; first_name: string; last_name: string; email: string } | null;
  fecha_solicitud: string;
  fecha_envio: string | null;
  fecha_recepcion: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  
  total_items?: number;
  items_enviados?: number;
  items_recibidos?: number;
}

export interface InventarioTransferenciaItem {
  id: string;
  transferencia_id: string;
  producto_id: string;
  producto?: InventarioProducto | null;
  cantidad_solicitada: number;
  cantidad_enviada: number;
  cantidad_recibida: number;
  estado: EstadoTransferenciaItem;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventarioStockUbicacion {
  producto_id: string;
  codigo: string;
  nombre: string;
  stock_total: number;
}

export interface FiltrosMovimientos {
  producto_id?: string;
  ubicacion_origen_id?: string;
  ubicacion_destino_id?: string;
  tipo?: TipoMovimientoInventario;
  fecha_desde?: string;
  fecha_hasta?: string;
  usuario_id?: string;
  lote_pistoleo_id?: string;
  page?: number;
  limit?: number;
}

export interface FiltrosProductos {
  search?: string;
  categoria_id?: string;
  ubicacion_id?: string;
  activo?: boolean;
  stock_bajo?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'codigo' | 'nombre' | 'stock_actual' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface FiltrosConteos {
  estado?: EstadoConteo;
  ubicacion_id?: string;
  categoria_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface FiltrosTransferencias {
  estado?: EstadoTransferencia;
  ubicacion_origen_id?: string;
  ubicacion_destino_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

export interface CrearProductoInput {
  codigo: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  unidad_medida: UnidadMedida;
  categoria_id?: string;
  ubicacion_id?: string;
  stock_minimo?: number;
  stock_maximo?: number;
  costo_promedio?: number;
  precio_venta?: number;
}

export interface ActualizarProductoInput extends Partial<CrearProductoInput> {
  activo?: boolean;
}

export interface CrearUbicacionInput {
  codigo: string;
  nombre: string;
  tipo: TipoUbicacion;
  ubicacion_padre_id?: string;
}

export interface CrearCategoriaInput {
  nombre: string;
  descripcion?: string;
  color?: string;
}

export interface CrearMovimientoInput {
  tipo: TipoMovimientoInventario;
  producto_id: string;
  ubicacion_origen_id?: string;
  ubicacion_destino_id?: string;
  cantidad: number;
  costo_unitario?: number;
  documento_referencia?: string;
  documento_tipo?: TipoDocumentoInventario;
  lote_pistoleo_id?: string;
  observaciones?: string;
}

export interface CrearConteoInput {
  nombre: string;
  ubicacion_id?: string;
  categoria_id?: string;
}

export interface ActualizarConteoItemInput {
  stock_fisico: number;
  observaciones?: string;
}

export interface AprobarConteoInput {
  aprobado: boolean;
  observaciones?: string;
}

export interface CrearTransferenciaInput {
  ubicacion_origen_id: string;
  ubicacion_destino_id: string;
  items: Array<{
    producto_id: string;
    cantidad_solicitada: number;
  }>;
  observaciones?: string;
}

export interface EnviarTransferenciaInput {
  items: Array<{
    id: string;
    cantidad_enviada: number;
  }>;
}

export interface RecibirTransferenciaInput {
  items: Array<{
    id: string;
    cantidad_recibida: number;
  }>;
}

export type ReporteTipo = 'stock' | 'valorizado' | 'kardex' | 'rotacion' | 'merma';

export interface ReporteFiltros {
  fecha_desde?: string;
  fecha_hasta?: string;
  ubicacion_id?: string;
  categoria_id?: string;
  producto_id?: string;
}