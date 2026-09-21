import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as local from "@/lib/localdb";
import type { StoreName } from "@/lib/localdb";

export type TableName = StoreName;

// ===== أنواع البيانات (نفس شكل الجداول السابقة، بدون أي اعتماد على Supabase) =====

export type ProjectStatus = "in_progress" | "on_hold" | "completed";
export type AccountType = "cash" | "bank";
export type ExpenseMainCategory = "materials" | "wages" | "services" | "operations";
export type PartyType = "worker" | "supplier" | "other";

type Base = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type Project = Base & {
  name: string;
  client_name: string | null;
  address: string | null;
  code: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  budget: number;
  description: string | null;
  status: ProjectStatus;
};

export type ProjectItem = Base & {
  project_id: string;
  name: string;
  estimated_cost: number;
  notes: string | null;
  sort_order: number;
};

export type Account = Base & {
  name: string;
  type: AccountType;
  opening_balance: number;
  notes: string | null;
  is_active: boolean;
};

export type Category = Base & {
  main_category: ExpenseMainCategory;
  name: string;
  is_active: boolean;
};

export type Worker = Base & {
  name: string;
  profession: string | null;
  phone: string | null;
  wage_type: string | null;
  agreed_wage: number;
  notes: string | null;
};

export type Supplier = Base & {
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export type Receipt = Base & {
  project_id: string | null;
  amount: number;
  receipt_date: string;
  payer: string | null;
  method: string | null;
  payment_no: string | null;
  account_id: string | null;
  notes: string | null;
  attachment_path: string | null;
};

export type Expense = Base & {
  project_id: string | null;
  project_item_id: string | null;
  total_amount: number;
  paid_amount: number;
  expense_date: string;
  main_category: ExpenseMainCategory;
  category_id: string | null;
  party_type: PartyType;
  worker_id: string | null;
  supplier_id: string | null;
  beneficiary_name: string | null;
  payment_method: string | null;
  account_id: string | null;
  invoice_no: string | null;
  description: string | null;
  notes: string | null;
  attachment_path: string | null;
};

export type Advance = Base & {
  worker_id: string;
  project_id: string | null;
  amount: number;
  settled_amount: number;
  advance_date: string;
  account_id: string | null;
  notes: string | null;
  attachment_path: string | null;
};

export type Settlement = Base & {
  party_type: PartyType;
  worker_id: string | null;
  supplier_id: string | null;
  project_id: string | null;
  amount: number;
  settlement_date: string;
  account_id: string | null;
  uses_advance: boolean;
  notes: string | null;
  attachment_path: string | null;
};

export type WorkerAttendance = Base & {
  worker_id: string;
  project_id: string | null;
  date: string;
};

// ===== خطافات القراءة/الكتابة — نفس الواجهة السابقة، لكن فوق IndexedDB بدل Supabase =====

function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  orderBy: string,
  ascending: boolean,
) {
  return [...rows].sort((a, b) => {
    const av = a[orderBy] as string | number | undefined;
    const bv = b[orderBy] as string | number | undefined;
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    return ascending ? (av < bv ? -1 : 1) : av < bv ? 1 : -1;
  });
}

export function useRows<T extends Record<string, unknown>>(
  table: TableName,
  orderBy = "created_at",
  ascending = false,
) {
  return useQuery({
    queryKey: [table],
    queryFn: async (): Promise<T[]> => {
      const rows = await local.getAll<T>(table);
      return sortRows(rows, orderBy, ascending);
    },
  });
}

export function useUpsert(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const now = new Date().toISOString();
      const id = (values["id"] as string | undefined) ?? crypto.randomUUID();
      const existing = values["id"]
        ? await local.getById<Record<string, unknown>>(table, id)
        : undefined;
      const record = {
        ...existing,
        ...values,
        id,
        created_at: (existing?.["created_at"] as string | undefined) ?? now,
        updated_at: now,
      };
      await local.put(table, record as { id: string });
      return record;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await local.removeById(table, id);
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export type SettlementDraft = {
  amount?: string;
  settlement_date?: string;
  account_id?: string | null;
  project_id?: string | null;
  notes?: string;
  attachment_path?: string | null;
  party_type?: "worker" | "supplier" | "other";
  supplier_id?: string | null;
  worker_id?: string | null;
  uses_advance?: boolean;
};

export type AdvanceDraft = {
  amount?: string;
  advance_date?: string;
  account_id?: string | null;
  project_id?: string | null;
  worker_id?: string | null;
  notes?: string;
  attachment_path?: string | null;
};
