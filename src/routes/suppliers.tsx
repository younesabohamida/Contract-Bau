import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaInput, Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { AttachmentField } from "@/components/AttachmentField";
import { StatCard } from "@/components/StatCard";
import { useRemove, useUpsert, type SettlementDraft, type Supplier } from "@/lib/db";
import { useLedger, toOptions } from "@/lib/useLedger";
import { supplierAccount } from "@/lib/finance";
import { money, today } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "الموردون — إدارة المقاولات" },
      {
        name: "description",
        content: "متابعة الموردين وإجمالي المشتريات والمدفوع والمستحق المتبقي.",
      },
      { property: "og:title", content: "الموردون — إدارة المقاولات" },
      { property: "og:description", content: "حسابات الموردين والمستحقات المتبقية." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { ledger, suppliers, accounts, projects } = useLedger();
  const upsert = useUpsert("suppliers");
  const remove = useRemove("suppliers");
  const settle = useUpsert("settlements");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Supplier>>({});
  const [pay, setPay] = useState<SettlementDraft>({});
  const [search, setSearch] = useState("");

  const rows = suppliers.filter((s) =>
    [s.name, s.phone, s.address].filter(Boolean).some((v) => (v as string).includes(search)),
  );

  const totals = rows.reduce(
    (acc, s) => {
      const a = supplierAccount(s, ledger);
      return {
        purchases: acc.purchases + a.purchases,
        paid: acc.paid + a.paid,
        remaining: acc.remaining + a.remaining,
      };
    },
    { purchases: 0, paid: 0, remaining: 0 },
  );

  return (
    <AppShell
      title="الموردون"
      subtitle="المشتريات والمستحقات لكل مورد"
      action={
        <Button
          onClick={() => {
            setDraft({});
            setOpen(true);
          }}
        >
          <Plus className="ml-1 h-4 w-4" /> مورد جديد
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي المشتريات" value={totals.purchases} />
        <StatCard label="المدفوع" value={totals.paid} tone="primary" />
        <StatCard label="المستحق المتبقي" value={totals.remaining} tone="danger" />
      </div>

      <Input
        placeholder="بحث باسم المورد أو الهاتف…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="card-soft overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المورد</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">إجمالي المشتريات</TableHead>
              <TableHead className="text-right">المدفوع</TableHead>
              <TableHead className="text-right">المستحق المتبقي</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const a = supplierAccount(s, ledger);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell dir="ltr">{s.phone ?? "—"}</TableCell>
                  <TableCell>{s.address ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{money(a.purchases)}</TableCell>
                  <TableCell className="tabular-nums text-primary">{money(a.paid)}</TableCell>
                  <TableCell className="tabular-nums text-destructive">
                    {money(a.remaining)}
                  </TableCell>
                  <TableCell>
                    <span className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPay({
                            party_type: "supplier",
                            supplier_id: s.id,
                            settlement_date: today(),
                            account_id: accounts[0]?.id ?? null,
                          });
                          setPayOpen(true);
                        }}
                      >
                        <HandCoins className="ml-1 h-3.5 w-3.5" /> سداد
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDraft(s);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (!confirm("حذف المورد؟")) return;
                          await remove.mutateAsync(s.id);
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
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  لا يوجد موردون
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل مورد" : "مورد جديد"}
        onSubmit={async () => {
          if (!draft.name) {
            toast.error("اسم المورد مطلوب");
            return;
          }
          await upsert.mutateAsync({
            id: draft.id,
            name: draft.name,
            phone: draft.phone ?? null,
            address: draft.address ?? null,
            notes: draft.notes ?? null,
          });
          toast.success("تم الحفظ");
          setOpen(false);
          setDraft({});
        }}
      >
        <Field label="اسم المورد">
          <TextInput
            value={draft.name ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            required
          />
        </Field>
        <Field label="الهاتف">
          <TextInput
            value={draft.phone ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
          />
        </Field>
        <Field label="العنوان">
          <TextInput
            value={draft.address ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, address: v }))}
          />
        </Field>
        <Field label="ملاحظات" full>
          <AreaInput
            value={draft.notes ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
          />
        </Field>
      </FormDialog>

      <FormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="سداد مستحقات مورد"
        description="السداد يخصم من السيولة ويقلل المستحقات، ولا يُحتسب كمصروف جديد."
        onSubmit={async () => {
          if (!pay.amount) {
            toast.error("المبلغ مطلوب");
            return;
          }
          await settle.mutateAsync({ ...pay, amount: Number(pay.amount) });
          toast.success("تم تسجيل السداد");
          setPayOpen(false);
          setPay({});
        }}
      >
        <Field label="المبلغ">
          <TextInput
            type="number"
            step="0.01"
            value={pay.amount ?? ""}
            onChange={(v) => setPay((p) => ({ ...p, amount: v }))}
            required
          />
        </Field>
        <Field label="التاريخ">
          <TextInput
            type="date"
            value={pay.settlement_date ?? today()}
            onChange={(v) => setPay((p) => ({ ...p, settlement_date: v }))}
          />
        </Field>
        <Field label="الحساب المالي">
          <Picker
            value={pay.account_id ?? null}
            onChange={(v) => setPay((p) => ({ ...p, account_id: v }))}
            allowEmpty
            options={toOptions(accounts)}
          />
        </Field>
        <Field label="المشروع">
          <Picker
            value={pay.project_id ?? null}
            onChange={(v) => setPay((p) => ({ ...p, project_id: v }))}
            allowEmpty
            options={toOptions(projects)}
          />
        </Field>
        <Field label="ملاحظات" full>
          <AreaInput
            value={pay.notes ?? ""}
            onChange={(v) => setPay((p) => ({ ...p, notes: v }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <AttachmentField
            label="سند الصرف"
            value={pay.attachment_path ?? null}
            onChange={(p) => setPay((prev) => ({ ...prev, attachment_path: p }))}
          />
        </div>
      </FormDialog>
    </AppShell>
  );
}
