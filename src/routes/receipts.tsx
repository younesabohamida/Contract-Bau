import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaInput, Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { AttachmentField, AttachmentLink } from "@/components/AttachmentField";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { StatCard } from "@/components/StatCard";
import { useRemove, useUpsert, type Receipt } from "@/lib/db";
import { useLedger, nameOf, toOptions } from "@/lib/useLedger";
import { formatDate, money, num, today } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/receipts")({
  head: () => ({
    meta: [
      { title: "المقبوضات — إدارة المقاولات" },
      {
        name: "description",
        content: "تسجيل المبالغ المستلمة من العملاء والممولين مع صور إثبات الاستلام.",
      },
      { property: "og:title", content: "المقبوضات — إدارة المقاولات" },
      { property: "og:description", content: "تسجيل ومتابعة المقبوضات وسندات القبض." },
    ],
  }),
  component: ReceiptsPage,
});

const METHODS = ["نقدي", "تحويل بنكي", "شيك", "شبكة"].map((m) => ({ value: m, label: m }));

function ReceiptsPage() {
  const { ledger, accounts, projects } = useLedger();
  const upsert = useUpsert("receipts");
  const remove = useRemove("receipts");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Receipt>>({});
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const set = (k: keyof Receipt, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const receiptShareText = (r: Receipt) =>
    [
      "مقبوض — إدارة المقاولات",
      `التاريخ: ${formatDate(r.receipt_date)}`,
      `الجهة الدافعة: ${r.payer ?? "—"}`,
      `المشروع: ${nameOf(projects, r.project_id)}`,
      `المبلغ: ${money(r.amount)}`,
      r.payment_no ? `رقم الدفعة: ${r.payment_no}` : null,
    ]
      .filter(Boolean)
      .join("\n");

  const rows = ledger.receipts.filter((r) => {
    if (projectFilter && r.project_id !== projectFilter) return false;
    if (accountFilter && r.account_id !== accountFilter) return false;
    if (from && r.receipt_date < from) return false;
    if (to && r.receipt_date > to) return false;
    if (
      search &&
      ![r.payer, r.payment_no, r.notes, r.method]
        .filter(Boolean)
        .some((v) => (v as string).includes(search))
    )
      return false;
    return true;
  });

  return (
    <AppShell
      title="المقبوضات"
      subtitle="المبالغ المستلمة من العملاء والممولين"
      action={
        <Button
          onClick={() => {
            setDraft({ receipt_date: today(), account_id: accounts[0]?.id ?? null });
            setOpen(true);
          }}
        >
          <Plus className="ml-1 h-4 w-4" /> استلام مبلغ
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="إجمالي المقبوضات (بعد التصفية)"
          value={rows.reduce((s, r) => s + num(r.amount), 0)}
          tone="success"
        />
      </div>

      <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="بحث…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Picker
          value={projectFilter}
          onChange={setProjectFilter}
          allowEmpty
          placeholder="كل المشاريع"
          options={toOptions(projects)}
        />
        <Picker
          value={accountFilter}
          onChange={setAccountFilter}
          allowEmpty
          placeholder="كل الحسابات"
          options={toOptions(accounts)}
        />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="card-soft overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">الجهة الدافعة</TableHead>
              <TableHead className="text-right">المشروع</TableHead>
              <TableHead className="text-right">طريقة الاستلام</TableHead>
              <TableHead className="text-right">رقم الدفعة</TableHead>
              <TableHead className="text-right">الحساب</TableHead>
              <TableHead className="text-right">المرفق</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatDate(r.receipt_date)}</TableCell>
                <TableCell className="tabular-nums font-semibold text-success">
                  {money(r.amount)}
                </TableCell>
                <TableCell>{r.payer ?? "—"}</TableCell>
                <TableCell>{nameOf(projects, r.project_id)}</TableCell>
                <TableCell>{r.method ?? "—"}</TableCell>
                <TableCell>{r.payment_no ?? "—"}</TableCell>
                <TableCell>{nameOf(accounts, r.account_id)}</TableCell>
                <TableCell>
                  <AttachmentLink path={r.attachment_path} />
                </TableCell>
                <TableCell>
                  <span className="flex gap-1">
                    <WhatsAppShareButton text={() => receiptShareText(r)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDraft(r);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!confirm("حذف سند القبض؟")) return;
                        await remove.mutateAsync(r.id);
                        toast.success("تم الحذف");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  لا توجد مقبوضات مطابقة
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل مقبوض" : "استلام مبلغ"}
        onSubmit={async () => {
          if (!draft.amount) {
            toast.error("المبلغ مطلوب");
            return;
          }
          await upsert.mutateAsync({
            id: draft.id,
            amount: Number(draft.amount),
            receipt_date: draft.receipt_date || today(),
            payer: draft.payer ?? null,
            method: draft.method ?? null,
            payment_no: draft.payment_no ?? null,
            account_id: draft.account_id ?? null,
            project_id: draft.project_id ?? null,
            notes: draft.notes ?? null,
            attachment_path: draft.attachment_path ?? null,
          });
          toast.success("تم تسجيل المقبوض");
          setOpen(false);
          setDraft({});
        }}
        submitting={upsert.isPending}
      >
        <Field label="المبلغ">
          <TextInput
            type="number"
            step="0.01"
            value={draft.amount ?? ""}
            onChange={(v) => set("amount", v)}
            required
          />
        </Field>
        <Field label="التاريخ">
          <TextInput
            type="date"
            value={draft.receipt_date ?? today()}
            onChange={(v) => set("receipt_date", v)}
          />
        </Field>
        <Field label="الجهة الدافعة">
          <TextInput value={draft.payer ?? ""} onChange={(v) => set("payer", v)} />
        </Field>
        <Field label="المشروع">
          <Picker
            value={draft.project_id ?? null}
            onChange={(v) => set("project_id", v)}
            allowEmpty
            options={toOptions(projects)}
          />
        </Field>
        <Field label="طريقة الاستلام">
          <Picker
            value={draft.method ?? null}
            onChange={(v) => set("method", v)}
            allowEmpty
            options={METHODS}
          />
        </Field>
        <Field label="رقم الدفعة">
          <TextInput value={draft.payment_no ?? ""} onChange={(v) => set("payment_no", v)} />
        </Field>
        <Field label="الحساب المالي المودع به">
          <Picker
            value={draft.account_id ?? null}
            onChange={(v) => set("account_id", v)}
            allowEmpty
            options={toOptions(accounts)}
          />
        </Field>
        <Field label="ملاحظات">
          <AreaInput value={draft.notes ?? ""} onChange={(v) => set("notes", v)} />
        </Field>
        <div className="sm:col-span-2">
          <AttachmentField
            label="صورة إثبات الاستلام"
            value={draft.attachment_path ?? null}
            onChange={(p) => set("attachment_path", p)}
          />
        </div>
      </FormDialog>
    </AppShell>
  );
}
