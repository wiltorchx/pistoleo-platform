export interface BatchRow {
  id: string;
  name: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  signature?: string;
}

export interface InventoryRow {
  id: string;
  batch_id: string;
  upc: string;
  description: string;
  expected_quantity: number;
  actual_quantity: number;
  status: string;
  updated_at: string;
}

export interface InventoryWithBatch extends InventoryRow {
  pistoleo_batches: { created_by: string };
}

export interface ScanRow {
  id: string;
  batch_id: string;
  upc: string;
  user_id: string;
  scanned_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'operator';
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}