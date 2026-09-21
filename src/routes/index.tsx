import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Picker } from "@/components/form-kit";
import { useLedger, nameOf } from "@/lib/useLedger";
import {
  cashOnHand,
  dateRangePreset,
  groupSum,
  scopeLedger,
  scopeLedgerByDate,
  totalLiabilities,
  totalPaidOut,
  totalReceipts,
} from "@/lib/finance";
import { getLastBackupAt } from "@/lib/backup";
import { formatDate, mainCategoryLabel, money, num } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — إدارة المقاولات والتشطيبات" },
      {
        name: "description",
        content: "متابعة المقبوضات والمصروفات والسيولة والالتزامات لمشاريع المقاولات والتشطيبات.",
      },
      { property: "og:title", content: "لوحة التحكم — إدارة المقاولات والتشطيبات" },
      {
        property: "og:description",
        content: "متابعة المقبوضات والمصروفات والسيولة والالتزامات لمشاريع المقاولات.",
      },
    ],
  }),
  component: Dashboard,
});

const PRESETS = [
  { key: "today", label: "اليوم" },
  { key: "week", label: "هذا الأسبوع" },
  { key: "month", label: "هذا الشهر" },
  { key: "last_month", label: "الشهر الماضي" },
] as const;

function Dashboard() {
  const { ledger, accounts, projects, items, workers, suppliers, categories } = useLedger();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    setLastBackup(getLastBackupAt());
  }, []);

  const scoped = useMemo(() => {
    const byProject = scopeLedger(ledger, projectId);
    return scopeLedgerByDate(byProject, dateRange.from, dateRange.to);
  }, [ledger, projectId, dateRange]);

  const backupIsStale =
    !lastBackup || Date.now() - new Date(lastBackup).getTime() > 14 * 24 * 60 * 60 * 1000;

  const receiptsTotal = totalReceipts(scoped);
  const paid = totalPaidOut(scoped);
  const liabilities = totalLiabilities(scoped);
  const cash = cashOnHand(accounts, ledger);

  const byCategory = groupSum(
    scoped.expenses,
    (e) =>
      e.category_id
        ? nameOf(categories, e.category_id)
        : mainCategoryLabel(e.main_category),
    (e) => num(e.total_amount),
  );
  const byItem = groupSum(
    scoped.expenses.filter((e) => e.project_item_id),
    (e) => nameOf(items, e.project_item_id),
    (e) => num(e.total_amount),
  );

  const partyName = (e: (typeof scoped.expenses)[number]) =>
    e.worker_id
      ? nameOf(workers, e.worker_id)
      : e.supplier_id
        ? nameOf(suppliers, e.supplier_id)
        : (e.beneficiary_name ?? "—");

  return (
    <AppShell
      title="لوحة التحكم"
      subtitle="ملخص الحركة المالية للمشاريع"
      action={
        <div className="w-56">
          <Picker
            value={projectId}
            onChange={setProjectId}
            allowEmpty
            placeholder="كل المشاريع"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
      }
    >
      {backupIsStale ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm">
          <span>
            {lastBackup
              ? `آخر نسخة احتياطية كانت منذ فترة (${formatDate(lastBackup.slice(0, 10))}) — يُفضّل تصدير نسخة جديدة.`
              : "لم يتم تصدير أي نسخة احتياطية بعد. بياناتك محفوظة على هذا الجهاز فقط."}
          </span>
          <Link to="/settings" className="font-semibold text-primary underline shrink-0">
            الذهاب للنسخ الاحتياطي
          </Link>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            type="button"
            size="sm"
            variant={activePreset === p.key ? "default" : "outline"}
            onClick={() => {
              setActivePreset(p.key);
              setDateRange(dateRangePreset(p.key));
            }}
          >
            {p.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={activePreset === null ? "default" : "outline"}
          onClick={() => {
            setActivePreset(null);
            setDateRange({ from: "", to: "" });
          }}
        >
          الكل
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="إجمالي المقبوضات"
          value={receiptsTotal}
          tone="success"
          icon={<ArrowDownCircle className="h-4 w-4" />}
        />
        <StatCard
          label="إجمالي المدفوع فعلياً"
          value={paid}
          tone="primary"
          icon={<ArrowUpCircle className="h-4 w-4" />}
        />
        <StatCard
          label="الرصيد النقدي المتوفر"
          value={cash}
          tone="default"
          hint="السيولة في كل الحسابات"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="الالتزامات والمستحقات"
          value={liabilities}
          tone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="الرصيد الصافي بعد الالتزامات"
          value={cash - liabilities}
          tone={cash - liabilities >= 0 ? "success" : "danger"}
          icon={<Scale className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card-soft p-4">
          <h2 className="mb-3 text-base font-bold">آخر المقبوضات</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الجهة الدافعة</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...scoped.receipts]
                .sort((a, b) => (a.receipt_date < b.receipt_date ? 1 : -1))
                .slice(0, 6)
                .map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.receipt_date)}</TableCell>
                    <TableCell>{r.payer ?? "—"}</TableCell>
                    <TableCell className="tabular-nums text-success">{money(r.amount)}</TableCell>
                  </TableRow>
                ))}
              {scoped.receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    لا توجد مقبوضات بعد
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <Link to="/receipts" className="mt-3 inline-block text-sm text-primary underline">
            كل المقبوضات
          </Link>
        </section>

        <section className="card-soft p-4">
          <h2 className="mb-3 text-base font-bold">آخر المصروفات</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المستفيد</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...scoped.expenses]
                .sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1))
                .slice(0, 6)
                .map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.expense_date)}</TableCell>
                    <TableCell>{partyName(e)}</TableCell>
                    <TableCell className="tabular-nums">{money(e.total_amount)}</TableCell>
                    <TableCell className="tabular-nums text-primary">
                      {money(e.paid_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              {scoped.expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    لا توجد مصروفات بعد
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <Link to="/expenses" className="mt-3 inline-block text-sm text-primary underline">
            كل المصروفات
          </Link>
        </section>

        <section className="card-soft p-4">
          <h2 className="mb-3 text-base font-bold">توزيع المصروفات حسب التصنيف</h2>
          <DistributionList rows={byCategory} />
        </section>

        <section className="card-soft p-4">
          <h2 className="mb-3 text-base font-bold">توزيع المصروفات حسب بند المشروع</h2>
          <DistributionList rows={byItem} />
        </section>
      </div>
    </AppShell>
  );
}

function DistributionList({ rows }: { rows: { name: string; total: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">لا توجد بيانات كافية بعد</p>;
  return (
    <ul className="space-y-2">
      {rows.slice(0, 8).map((r) => (
        <li key={r.name}>
          <div className="flex items-center justify-between text-sm">
            <span>{r.name}</span>
            <span className="tabular-nums text-muted-foreground">{money(r.total)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${(r.total / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
