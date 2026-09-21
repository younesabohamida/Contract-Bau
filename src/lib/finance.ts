import { num } from "./format";
import type {
  Account,
  Advance,
  Expense,
  Receipt,
  Settlement,
  Supplier,
  Worker,
} from "./db";

export type Ledger = {
  receipts: Receipt[];
  expenses: Expense[];
  advances: Advance[];
  settlements: Settlement[];
};

const inProject = (projectId: string | null, row: { project_id: string | null }) =>
  !projectId || row.project_id === projectId;

export function scopeLedger(l: Ledger, projectId: string | null): Ledger {
  if (!projectId) return l;
  return {
    receipts: l.receipts.filter((r) => inProject(projectId, r)),
    expenses: l.expenses.filter((r) => inProject(projectId, r)),
    advances: l.advances.filter((r) => inProject(projectId, r)),
    settlements: l.settlements.filter((r) => inProject(projectId, r)),
  };
}

const inRange = (from: string, to: string, date: string) =>
  (!from || date >= from) && (!to || date <= to);

/** يحصر الحركات المالية ضمن مدى تاريخي (فارغ = بلا حد). */
export function scopeLedgerByDate(l: Ledger, from: string, to: string): Ledger {
  if (!from && !to) return l;
  return {
    receipts: l.receipts.filter((r) => inRange(from, to, r.receipt_date)),
    expenses: l.expenses.filter((r) => inRange(from, to, r.expense_date)),
    advances: l.advances.filter((r) => inRange(from, to, r.advance_date)),
    settlements: l.settlements.filter((r) => inRange(from, to, r.settlement_date)),
  };
}

export function dateRangePreset(preset: "today" | "week" | "month" | "last_month") {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === "today") return { from: iso(now), to: iso(now) };
  if (preset === "week") {
    const day = now.getDay(); // 0=Sunday
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    return { from: iso(start), to: iso(now) };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: iso(start), to: iso(now) };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: iso(start), to: iso(end) };
}

/** إجمالي المقبوضات */
export const totalReceipts = (l: Ledger) =>
  l.receipts.reduce((s, r) => s + num(r.amount), 0);

/** المدفوع فعلياً (سيولة خارجة): مصروفات مدفوعة + سلف + تسويات نقدية */
export const totalPaidOut = (l: Ledger) =>
  l.expenses.reduce((s, e) => s + num(e.paid_amount), 0) +
  l.advances.reduce((s, a) => s + num(a.amount), 0) +
  l.settlements.filter((s2) => !s2.uses_advance).reduce((s, x) => s + num(x.amount), 0);

/** إجمالي المصروفات المستحقة (بالكامل) */
export const totalExpenses = (l: Ledger) =>
  l.expenses.reduce((s, e) => s + num(e.total_amount), 0);

/** الالتزامات والمستحقات المتبقية */
export const totalLiabilities = (l: Ledger) => {
  const unpaid = l.expenses.reduce((s, e) => s + (num(e.total_amount) - num(e.paid_amount)), 0);
  const settled = l.settlements.reduce((s, x) => s + num(x.amount), 0);
  return Math.max(0, unpaid - settled);
};

/** رصيد حساب مالي */
export function accountBalance(account: Account, l: Ledger) {
  const inflow = l.receipts
    .filter((r) => r.account_id === account.id)
    .reduce((s, r) => s + num(r.amount), 0);
  const out =
    l.expenses.filter((e) => e.account_id === account.id).reduce((s, e) => s + num(e.paid_amount), 0) +
    l.advances.filter((a) => a.account_id === account.id).reduce((s, a) => s + num(a.amount), 0) +
    l.settlements
      .filter((x) => x.account_id === account.id && !x.uses_advance)
      .reduce((s, x) => s + num(x.amount), 0);
  return num(account.opening_balance) + inflow - out;
}

export const cashOnHand = (accounts: Account[], l: Ledger) =>
  accounts.reduce((s, a) => s + accountBalance(a, l), 0);

/** حساب العامل */
export function workerAccount(worker: Worker, l: Ledger) {
  const exp = l.expenses.filter((e) => e.worker_id === worker.id);
  const due = exp.reduce((s, e) => s + num(e.total_amount), 0);
  const paidDirect = exp.reduce((s, e) => s + num(e.paid_amount), 0);
  const settlements = l.settlements
    .filter((x) => x.worker_id === worker.id)
    .reduce((s, x) => s + num(x.amount), 0);
  const advances = l.advances.filter((a) => a.worker_id === worker.id);
  const advancesTotal = advances.reduce((s, a) => s + num(a.amount), 0);
  const advancesSettled = advances.reduce((s, a) => s + num(a.settled_amount), 0);
  const paid = paidDirect + settlements;
  return {
    due,
    paid,
    remaining: Math.max(0, due - paid),
    advancesTotal,
    advancesOutstanding: Math.max(0, advancesTotal - advancesSettled),
  };
}

/** حساب المورد */
export function supplierAccount(supplier: Supplier, l: Ledger) {
  const exp = l.expenses.filter((e) => e.supplier_id === supplier.id);
  const purchases = exp.reduce((s, e) => s + num(e.total_amount), 0);
  const paid =
    exp.reduce((s, e) => s + num(e.paid_amount), 0) +
    l.settlements.filter((x) => x.supplier_id === supplier.id).reduce((s, x) => s + num(x.amount), 0);
  return { purchases, paid, remaining: Math.max(0, purchases - paid) };
}

export type StatementRow = {
  date: string;
  label: string;
  receipt: number;
  paid: number;
  balance: number;
};

/** كشف حساب متسلسل */
export function buildStatement(l: Ledger, labels: { expenseLabel: (e: Expense) => string }) {
  const rows: Omit<StatementRow, "balance">[] = [
    ...l.receipts.map((r) => ({
      date: r.receipt_date,
      label: `مقبوض من ${r.payer ?? "جهة غير محددة"}${r.payment_no ? ` - دفعة ${r.payment_no}` : ""}`,
      receipt: num(r.amount),
      paid: 0,
    })),
    ...l.expenses
      .filter((e) => num(e.paid_amount) > 0)
      .map((e) => ({
        date: e.expense_date,
        label: labels.expenseLabel(e),
        receipt: 0,
        paid: num(e.paid_amount),
      })),
    ...l.advances.map((a) => ({
      date: a.advance_date,
      label: "سلفة لعامل",
      receipt: 0,
      paid: num(a.amount),
    })),
    ...l.settlements
      .filter((s) => !s.uses_advance)
      .map((s) => ({
        date: s.settlement_date,
        label: "سداد مستحقات",
        receipt: 0,
        paid: num(s.amount),
      })),
  ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let balance = 0;
  return rows.map((r) => {
    balance += r.receipt - r.paid;
    return { ...r, balance };
  });
}

export function groupSum<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    map.set(k, (map.get(k) ?? 0) + value(r));
  }
  return [...map.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}
