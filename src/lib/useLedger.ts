import { useRows } from "./db";
import type {
  Account,
  Advance,
  Category,
  Expense,
  Project,
  ProjectItem,
  Receipt,
  Settlement,
  Supplier,
  Worker,
  WorkerAttendance,
} from "./db";
import type { Ledger } from "./finance";

export function useLedger() {
  const receipts = useRows<Receipt>("receipts", "receipt_date");
  const expenses = useRows<Expense>("expenses", "expense_date");
  const advances = useRows<Advance>("worker_advances", "advance_date");
  const settlements = useRows<Settlement>("settlements", "settlement_date");
  const accounts = useRows<Account>("accounts", "created_at", true);
  const projects = useRows<Project>("projects");
  const items = useRows<ProjectItem>("project_items", "sort_order", true);
  const categories = useRows<Category>("categories", "name", true);
  const workers = useRows<Worker>("workers", "name", true);
  const suppliers = useRows<Supplier>("suppliers", "name", true);
  const attendance = useRows<WorkerAttendance>("worker_attendance", "date", false);

  const ledger: Ledger = {
    receipts: receipts.data ?? [],
    expenses: expenses.data ?? [],
    advances: advances.data ?? [],
    settlements: settlements.data ?? [],
  };

  return {
    ledger,
    accounts: accounts.data ?? [],
    projects: projects.data ?? [],
    items: items.data ?? [],
    categories: categories.data ?? [],
    workers: workers.data ?? [],
    suppliers: suppliers.data ?? [],
    attendance: attendance.data ?? [],
    loading:
      receipts.isLoading ||
      expenses.isLoading ||
      accounts.isLoading ||
      projects.isLoading,
  };
}

export const nameOf = <T extends { id: string; name: string }>(
  rows: T[],
  id: string | null | undefined,
) => rows.find((r) => r.id === id)?.name ?? "—";

export const toOptions = <T extends { id: string; name: string }>(rows: T[]) =>
  rows.map((r) => ({ value: r.id, label: r.name }));
