import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AreaInput, Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { AttachmentField, AttachmentLink } from "@/components/AttachmentField";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { StatCard } from "@/components/StatCard";
import { useRemove, useUpsert, type Expense } from "@/lib/db";
import { useLedger, nameOf, toOptions } from "@/lib/useLedger";
import {
  MAIN_CATEGORIES,
  PARTY_TYPES,
  formatDate,
  mainCategoryLabel,
  money,
  num,
  today,
} from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "المصروفات — إدارة المقاولات" },
      {
        name: "description",
        content:
          "تسجيل المصروفات بالفصل المحاسبي بين المدفوع فعلياً والمتبقي كالتزام على المشروع.",
      },
      { property: "og:title", content: "المصروفات — إدارة المقاولات" },
      {
        property: "og:description",
        content: "المصروفات مع المدفوع فعلياً والمستحق المتبقي ومرفقات الفواتير.",
      },
    ],
  }),
  component: ExpensesPage,
});

const PAY_METHODS = ["نقدي", "تحويل بنكي", "شيك", "شبكة", "آجل"].map((m) => ({
  value: m,
  label: m,
}));

function ExpensesPage() {
  const { ledger, accounts, projects, items, categories, workers, suppliers } = useLedger();
  const upsert = useUpsert("expenses");
  const remove = useRemove("expenses");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Expense>>({});
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<string | null>(null);
  const [mainFilter, setMainFilter] = useState<string | null>(null);
  const [workerFilter, setWorkerFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const set = (k: keyof Expense, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const rows = ledger.expenses.filter((e) => {
    if (projectFilter && e.project_id !== projectFilter) return false;
    if (itemFilter && e.project_item_id !== itemFilter) return false;
    if (mainFilter && e.main_category !== mainFilter) return false;
    if (workerFilter && e.worker_id !== workerFilter) return false;
    if (supplierFilter && e.supplier_id !== supplierFilter) return false;
    if (accountFilter && e.account_id !== accountFilter) return false;
    if (from && e.expense_date < from) return false;
    if (to && e.expense_date > to) return false;
    if (
      search &&
      ![e.description, e.invoice_no, e.beneficiary_name, e.notes]
        .filter(Boolean)
        .some((v) => (v as string).includes(search))
    )
      return false;
    return true;
  });

  const totals = rows.reduce(
    (acc, e) => ({
      total: acc.total + num(e.total_amount),
      paid: acc.paid + num(e.paid_amount),
      due: acc.due + num(e.total_amount) - num(e.paid_amount),
    }),
    { total: 0, paid: 0, due: 0 },
  );

  const beneficiary = (e: Expense) =>
    e.worker_id
      ? nameOf(workers, e.worker_id)
      : e.supplier_id
        ? nameOf(suppliers, e.supplier_id)
        : (e.beneficiary_name ?? "—");

  const projectItems = items.filter(
    (i) => !draft.project_id || i.project_id === draft.project_id,
  );

  const expenseShareText = (e: Expense) => {
    const due = num(e.total_amount) - num(e.paid_amount);
    return [
      "مصروف — إدارة المقاولات",
      `التاريخ: ${formatDate(e.expense_date)}`,
      `التصنيف: ${mainCategoryLabel(e.main_category)}`,
      `المستفيد: ${beneficiary(e)}`,
      `الإجمالي: ${money(e.total_amount)}`,
      `المدفوع: ${money(e.paid_amount)}`,
      due > 0 ? `المتبقي: ${money(due)}` : "الحالة: مسدد بالكامل",
      e.description ? `الوصف: ${e.description}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const repeatLastExpense = () => {
    const last = [...ledger.expenses].sort((a, b) =>
      a.expense_date < b.expense_date ? 1 : -1,
    )[0];
    if (!last) {
      toast.error("لا يوجد مصروف سابق لتكراره");
      return;
    }
    const { id: _id, ...rest } = last;
    setDraft({ ...rest, expense_date: today() });
    setOpen(true);
  };

  return (
    <AppShell
      title="المصروفات"
      subtitle="القاعدة المحاسبية: السيولة تنقص بالمدفوع فعلياً فقط، والمتبقي يُسجل كالتزام"
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={repeatLastExpense}>
            <Repeat className="ml-1 h-4 w-4" /> تكرار آخر مصروف
          </Button>
          <Button
            onClick={() => {
              setDraft({
                expense_date: today(),
                main_category: "materials",
                party_type: "other",
                account_id: accounts[0]?.id ?? null,
              });
              setOpen(true);
            }}
          >
            <Plus className="ml-1 h-4 w-4" /> إضافة مصروف
          </Button>
        </div>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي المصروفات" value={totals.total} />
        <StatCard label="المدفوع فعلياً" value={totals.paid} tone="primary" />
        <StatCard label="المتبقي كالتزام" value={totals.due} tone="danger" />
      </div>

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="بحث بالوصف أو رقم الفاتورة…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Picker value={projectFilter} onChange={setProjectFilter} allowEmpty placeholder="كل المشاريع" options={toOptions(projects)} />
        <Picker
          value={itemFilter}
          onChange={setItemFilter}
          allowEmpty
          placeholder="كل البنود"
          options={items
            .filter((i) => !projectFilter || i.project_id === projectFilter)
            .map((i) => ({ value: i.id, label: i.name }))}
        />
        <Picker
          value={mainFilter}
          onChange={setMainFilter}
          allowEmpty
          placeholder="كل التصنيفات"
          options={MAIN_CATEGORIES.map((m) => ({ value: m.value, label: m.label }))}
        />
        <Picker value={workerFilter} onChange={setWorkerFilter} allowEmpty placeholder="كل العمال" options={toOptions(workers)} />
        <Picker value={supplierFilter} onChange={setSupplierFilter} allowEmpty placeholder="كل الموردين" options={toOptions(suppliers)} />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Picker value={accountFilter} onChange={setAccountFilter} allowEmpty placeholder="كل الحسابات" options={toOptions(accounts)} />
      </div>

      <div className="card-soft overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الإجمالي</TableHead>
              <TableHead className="text-right">المدفوع</TableHead>
              <TableHead className="text-right">المتبقي</TableHead>
              <TableHead className="text-right">التصنيف</TableHead>
              <TableHead className="text-right">البند</TableHead>
              <TableHead className="text-right">المستفيد</TableHead>
              <TableHead className="text-right">الحساب</TableHead>
              <TableHead className="text-right">فاتورة</TableHead>
              <TableHead className="text-right">المرفق</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => {
              const due = num(e.total_amount) - num(e.paid_amount);
              return (
                <TableRow key={e.id}>
                  <TableCell>{formatDate(e.expense_date)}</TableCell>
                  <TableCell className="tabular-nums font-semibold">{money(e.total_amount)}</TableCell>
                  <TableCell className="tabular-nums text-primary">{money(e.paid_amount)}</TableCell>
                  <TableCell className="tabular-nums">
                    {due > 0 ? (
                      <Badge variant="destructive">{money(due)}</Badge>
                    ) : (
                      <span className="text-muted-foreground">مسدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mainCategoryLabel(e.main_category)}
                    {e.category_id ? ` / ${nameOf(categories, e.category_id)}` : ""}
                  </TableCell>
                  <TableCell>{nameOf(items, e.project_item_id)}</TableCell>
                  <TableCell>{beneficiary(e)}</TableCell>
                  <TableCell>{nameOf(accounts, e.account_id)}</TableCell>
                  <TableCell>{e.invoice_no ?? "—"}</TableCell>
                  <TableCell>
                    <AttachmentLink path={e.attachment_path} />
                  </TableCell>
                  <TableCell>
                    <span className="flex gap-1">
                      <WhatsAppShareButton text={() => expenseShareText(e)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDraft(e);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (!confirm("حذف المصروف؟")) return;
                          await remove.mutateAsync(e.id);
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  لا توجد مصروفات مطابقة
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل مصروف" : "إضافة مصروف"}
        description="المبلغ المتبقي يُسجل تلقائياً كالتزام على الجهة الدائنة ولا يخصم من السيولة."
        onSubmit={async () => {
          const total = Number(draft.total_amount ?? 0);
          const paid = Number(draft.paid_amount ?? 0);
          if (!total) {
            toast.error("المبلغ الإجمالي مطلوب");
            return;
          }
          if (paid > total) {
            toast.error("المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي");
            return;
          }
          await upsert.mutateAsync({
            id: draft.id,
            total_amount: total,
            paid_amount: paid,
            expense_date: draft.expense_date || today(),
            main_category: draft.main_category ?? "materials",
            category_id: draft.category_id ?? null,
            project_id: draft.project_id ?? null,
            project_item_id: draft.project_item_id ?? null,
            party_type: draft.party_type ?? "other",
            worker_id: draft.party_type === "worker" ? (draft.worker_id ?? null) : null,
            supplier_id: draft.party_type === "supplier" ? (draft.supplier_id ?? null) : null,
            beneficiary_name: draft.beneficiary_name ?? null,
            payment_method: draft.payment_method ?? null,
            account_id: paid > 0 ? (draft.account_id ?? null) : (draft.account_id ?? null),
            invoice_no: draft.invoice_no ?? null,
            description: draft.description ?? null,
            notes: draft.notes ?? null,
            attachment_path: draft.attachment_path ?? null,
          });
          toast.success("تم تسجيل المصروف");
          setOpen(false);
          setDraft({});
        }}
        submitting={upsert.isPending}
      >
        <Field label="المبلغ الإجمالي">
          <TextInput
            type="number"
            step="0.01"
            value={draft.total_amount ?? ""}
            onChange={(v) => set("total_amount", v)}
            required
          />
        </Field>
        <Field
          label="المبلغ المدفوع فعلياً الآن"
          hint={`المتبقي كالتزام: ${money(
            Math.max(0, Number(draft.total_amount ?? 0) - Number(draft.paid_amount ?? 0)),
          )}`}
        >
          <TextInput
            type="number"
            step="0.01"
            value={draft.paid_amount ?? ""}
            onChange={(v) => set("paid_amount", v)}
          />
        </Field>
        <Field label="التاريخ">
          <TextInput
            type="date"
            value={draft.expense_date ?? today()}
            onChange={(v) => set("expense_date", v)}
          />
        </Field>
        <Field label="التصنيف الرئيسي">
          <Picker
            value={draft.main_category ?? "materials"}
            onChange={(v) => {
              set("main_category", v);
              set("category_id", null);
            }}
            options={MAIN_CATEGORIES.map((m) => ({ value: m.value, label: m.label }))}
          />
        </Field>
        <Field label="التصنيف الفرعي">
          <Picker
            value={draft.category_id ?? null}
            onChange={(v) => set("category_id", v)}
            allowEmpty
            options={categories
              .filter((c) => c.main_category === (draft.main_category ?? "materials"))
              .map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="المشروع">
          <Picker
            value={draft.project_id ?? null}
            onChange={(v) => {
              set("project_id", v);
              set("project_item_id", null);
            }}
            allowEmpty
            options={toOptions(projects)}
          />
        </Field>
        <Field label="بند المشروع">
          <Picker
            value={draft.project_item_id ?? null}
            onChange={(v) => set("project_item_id", v)}
            allowEmpty
            options={projectItems.map((i) => ({ value: i.id, label: i.name }))}
          />
        </Field>
        <Field label="نوع المستفيد">
          <Picker
            value={draft.party_type ?? "other"}
            onChange={(v) => set("party_type", v)}
            options={PARTY_TYPES.map((p) => ({ value: p.value, label: p.label }))}
          />
        </Field>
        {draft.party_type === "worker" ? (
          <Field label="العامل / الحرفي">
            <Picker
              value={draft.worker_id ?? null}
              onChange={(v) => set("worker_id", v)}
              allowEmpty
              options={toOptions(workers)}
            />
          </Field>
        ) : null}
        {draft.party_type === "supplier" ? (
          <Field label="المورد">
            <Picker
              value={draft.supplier_id ?? null}
              onChange={(v) => set("supplier_id", v)}
              allowEmpty
              options={toOptions(suppliers)}
            />
          </Field>
        ) : null}
        {draft.party_type === "other" ? (
          <Field label="اسم الجهة المستفيدة">
            <TextInput
              value={draft.beneficiary_name ?? ""}
              onChange={(v) => set("beneficiary_name", v)}
            />
          </Field>
        ) : null}
        <Field label="طريقة الدفع">
          <Picker
            value={draft.payment_method ?? null}
            onChange={(v) => set("payment_method", v)}
            allowEmpty
            options={PAY_METHODS}
          />
        </Field>
        <Field label="الحساب المالي الذي خرج منه المال">
          <Picker
            value={draft.account_id ?? null}
            onChange={(v) => set("account_id", v)}
            allowEmpty
            options={toOptions(accounts)}
          />
        </Field>
        <Field label="رقم الفاتورة">
          <TextInput value={draft.invoice_no ?? ""} onChange={(v) => set("invoice_no", v)} />
        </Field>
        <Field label="الوصف">
          <TextInput value={draft.description ?? ""} onChange={(v) => set("description", v)} />
        </Field>
        <Field label="ملاحظات">
          <AreaInput value={draft.notes ?? ""} onChange={(v) => set("notes", v)} />
        </Field>
        <div className="sm:col-span-2">
          <AttachmentField
            label="صورة الفاتورة / الإيصال"
            value={draft.attachment_path ?? null}
            onChange={(p) => set("attachment_path", p)}
          />
        </div>
      </FormDialog>
    </AppShell>
  );
}
