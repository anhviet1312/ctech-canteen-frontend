export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'manager' | 'staff';
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  supplier_id: number | null;
  unit: string;
  min_quantity: number;
  current_stock: number;
  price: number;
  description: string;
  is_active: boolean;
  category?: Category;
  supplier?: Supplier;
}

export interface ImportItem {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  expiry_date: string | null;
}

export interface ImportOrder {
  id: number;
  code: string;
  supplier_id: number | null;
  supplier?: Supplier;
  created_by: number;
  created_at: string;
  notes: string;
  total_amount: number;
  proposal_id: number | null;
  items: ImportItem[];
  creator?: User;
}

export interface ExportItem {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
}

export interface ExportOrder {
  id: number;
  code: string;
  created_by: number;
  created_at: string;
  reason: string;
  notes: string;
  items: ExportItem[];
  creator?: User;
}

export interface ProposalItem {
  id: number;
  proposal_id: number;
  product_id: number;
  product?: Product;
  current_stock: number;
  suggested_quantity: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  daily_consumption: number;
}

export interface ProposalLog {
  id: number;
  proposal_id: number;
  action: string;
  actor_id: number;
  actor?: User;
  comment: string;
  created_at: string;
}

export interface Proposal {
  id: number;
  code: string;
  created_by: number;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  ai_generated: boolean;
  notes: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_comment: string;
  items: ProposalItem[];
  logs: ProposalLog[];
  creator?: User;
  reviewer?: User;
}

export interface AISuggestion {
  product_id: number;
  product_name: string;
  product_code: string;
  unit: string;
  current_stock: number;
  suggested_quantity: number;
  daily_consumption: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DashboardSummary {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  pending_proposals: number;
  today_imports: number;
  today_exports: number;
}

export interface InventoryItem {
  product_id: number;
  product_code: string;
  product_name: string;
  category_name: string;
  unit: string;
  current_stock: number;
  min_quantity: number;
  price: number;
  stock_value: number;
}
