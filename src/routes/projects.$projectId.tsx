import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, Trash2, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaInput, Field, FormDialog, TextInput } from "@/components/form-kit";
import { AttachmentLink } from "@/components/AttachmentField";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { useRemove, useUpsert, type ProjectItem } from "@/lib/db";
import { useLedger, nameOf } from "@/lib/useLedger";
import {
  buildStatement,
  cashOnHand,
  scopeLedger,
  totalLiabilities,
  totalPaidOut,
  totalReceipts,
} from "@/lib/finance";
import { formatDate, mainCategoryLabel, money, num, statusLabel } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "تفاصيل المشروع — إدارة المقاولات" },
      {
        name: "description",
        content: "بنود المشروع وكشف الحساب المتسلسل وتوزيع تكاليف الأعمال.",
      },
      { property: "og:title", content: "تفاصيل المشروع — إدارة المقاولات" },
      { property: "og:description", content: "بنود المشروع وكشف الحساب المتسلسل." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { ledger, projects, items, categories, workers, suppliers, accounts } = useLedger();
  const upsertItem = useUpsert("project_items");
  const removeItem = useRemove("project_items");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<ProjectItem>>({});

  const project = projects.find((p) => p.id === projectId);
  const scoped = scopeLedger(ledger, projectId);
  const projectItems = items.filter((i) => i.project_id === projectId);

  const receipts = totalReceipts(scoped);
  const paid = totalPaidOut(scoped);
  const liabilities = totalLiabilities(scoped);

  const statement = buildStatement(scoped, {
    expenseLabel: (e) =>
      [
        mainCategoryLabel(e.main_category),
        e.category_id ? nameOf(categories, e.category_id) : null,
        e.project_item_id ? `بند ${nameOf(projectItems, e.project_item_id)}` : null,
        e.worker_id
          ? nameOf(workers, e.worker_id)
          : e.supplier_id
            ? nameOf(suppliers, e.supplier_id)
            : e.beneficiary_name,
      ]
        .filter(Boolean)
        .join(" - "),
  });

  const itemCost = (itemId: string) =>
    scoped.expenses
      .filter((e) => e.project_item_id === itemId)
      .reduce((s, e) => s + num(e.total_amount), 0);
  const itemPaid = (itemId: string) =>
    scoped.expenses
      .filter((e) => e.project_item_id === itemId)
      .reduce((s, e) => s + num(e.paid_amount), 0);

  if (!project) {
    return (
      <AppShell title="المشروع غير موجود">
        <Link to="/projects" className="text-primary underline">
          العودة إلى المشاريع
        </Link>
      </AppShell>
    );
  }

  const statementShareText = [
    `كشف حساب مشروع: ${project.name}`,
    `العميل: ${project.client_name ?? "—"}`,
    `المقبوضات: ${money(receipts)}`,
    `المدفوع فعلياً: ${money(paid)}`,
    `الالتزامات المتبقية: ${money(liabilities)}`,
    "",
    ...statement
      .slice(-15)
      .map((r) => `${formatDate(r.date)} — ${r.label} — ${money(r.receipt || -r.paid)}`),
    statement.length > 15 ? "\n(القائمة مختصرة لآخر 15 حركة، افتح التطبيق للتفاصيل الكاملة)" : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <AppShell
      title={project.name}
      subtitle={`${project.client_name ?? "بدون عميل"} — ${statusLabel(project.status)}`}
      action={
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <ArrowRight className="h-4 w-4" /> كل المشاريع
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="الميزانية" value={num(project.budget)} />
        <StatCard label="المقبوضات" value={receipts} tone="success" />
        <StatCard label="المدفوع فعلياً" value={paid} tone="primary" />
        <StatCard label="الالتزامات المتبقية" value={liabilities} tone="danger" />
        <StatCard label="رصيد المشروع" value={receipts - paid} tone="default" />
      </div>

      <Tabs defaultValue="items" className="mt-6" dir="rtl">
        <TabsList>
          <TabsTrigger value="items">بنود المشروع</TabsTrigger>
          <TabsTrigger value="statement">كشف الحساب</TabsTrigger>
          <TabsTrigger value="docs">المرفقات</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setDraft({ project_id: projectId });
                setOpen(true);
              }}
            >
              <Plus className="ml-1 h-4 w-4" /> بند مخصص
            </Button>
          </div>
          <div className="card-soft overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">البند</TableHead>
                  <TableHead className="text-right">التكلفة التقديرية</TableHead>
                  <TableHead className="text-right">التكلفة الفعلية</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">الفرق عن التقدير</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectItems.map((i) => {
                  const actual = itemCost(i.id);
                  const diff = num(i.estimated_cost) - actual;
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-semibold">{i.name}</TableCell>
                      <TableCell className="tabular-nums">{money(i.estimated_cost)}</TableCell>
                      <TableCell className="tabular-nums">{money(actual)}</TableCell>
                      <TableCell className="tabular-nums text-primary">
                        {money(itemPaid(i.id))}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {num(i.estimated_cost) === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={diff >= 0 ? "secondary" : "destructive"}>
                            {money(Math.abs(diff))} {diff >= 0 ? "متاح" : "تجاوز"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDraft(i);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (!confirm("حذف البند؟")) return;
                              await removeItem.mutateAsync(i.id);
                              toast.success("تم الحذف");
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {projectItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      لا توجد بنود بعد
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="statement" className="mt-4">
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            <WhatsAppShareButton
              size="sm"
              variant="outline"
              label="مشاركة كشف الحساب عبر واتساب"
              text={() => statementShareText}
            />
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="ml-1 h-4 w-4" /> طباعة / حفظ PDF
            </Button>
          </div>
          <div className="card-soft overflow-x-auto p-2 print-area" id="statement-print">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">البيان</TableHead>
                  <TableHead className="text-right">المقبوض</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">الرصيد التراكمي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell>{r.label}</TableCell>
                    <TableCell className="tabular-nums text-success">
                      {r.receipt ? money(r.receipt) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-primary">
                      {r.paid ? money(r.paid) : "—"}
                    </TableCell>
                    <TableCell
                      className={
                        r.balance >= 0
                          ? "tabular-nums font-semibold"
                          : "tabular-nums font-semibold text-destructive"
                      }
                    >
                      {money(r.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                {statement.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      لا توجد حركات مالية على هذا المشروع
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <div className="card-soft overflow-x-auto p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">البيان</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحساب</TableHead>
                  <TableHead className="text-right">المرفق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ...scoped.receipts.map((r) => ({
                    id: r.id,
                    date: r.receipt_date,
                    kind: "سند قبض",
                    label: r.payer ?? "—",
                    amount: num(r.amount),
                    account: nameOf(accounts, r.account_id),
                    path: r.attachment_path,
                  })),
                  ...scoped.expenses.map((e) => ({
                    id: e.id,
                    date: e.expense_date,
                    kind: "فاتورة مصروف",
                    label: e.description ?? e.invoice_no ?? "—",
                    amount: num(e.total_amount),
                    account: nameOf(accounts, e.account_id),
                    path: e.attachment_path,
                  })),
                ]
                  .filter((r) => r.path)
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{formatDate(r.date)}</TableCell>
                      <TableCell>{r.kind}</TableCell>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className="tabular-nums">{money(r.amount)}</TableCell>
                      <TableCell>{r.account}</TableCell>
                      <TableCell>
                        <AttachmentLink path={r.path} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <p className="mt-6 text-xs text-muted-foreground">
        السيولة الكلية في جميع الحسابات: {money(cashOnHand(accounts, ledger))}
      </p>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل بند" : "بند جديد"}
        onSubmit={async () => {
          if (!draft.name) {
            toast.error("اسم البند مطلوب");
            return;
          }
          await upsertItem.mutateAsync({
            id: draft.id,
            project_id: projectId,
            name: draft.name,
            estimated_cost: Number(draft.estimated_cost ?? 0),
            notes: draft.notes ?? null,
          });
          toast.success("تم الحفظ");
          setOpen(false);
          setDraft({});
        }}
      >
        <Field label="اسم البند">
          <TextInput
            value={draft.name ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            required
          />
        </Field>
        <Field label="التكلفة التقديرية">
          <TextInput
            type="number"
            step="0.01"
            value={draft.estimated_cost ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, estimated_cost: Number(v) }))}
          />
        </Field>
        <Field label="ملاحظات" full>
          <AreaInput
            value={draft.notes ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
          />
        </Field>
      </FormDialog>
    </AppShell>
  );
}
