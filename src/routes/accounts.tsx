import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Wallet, Landmark } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { AreaInput, Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { useRemove, useUpsert, type Account } from "@/lib/db";
import { useLedger } from "@/lib/useLedger";
import { accountBalance, cashOnHand } from "@/lib/finance";
import { money } from "@/lib/format";
import { StatCard } from "@/components/StatCard";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "الحسابات المالية — إدارة المقاولات" },
      {
        name: "description",
        content: "الصندوق النقدي والبنك ومتابعة أرصدة الحسابات ومصادر الدفع.",
      },
      { property: "og:title", content: "الحسابات المالية — إدارة المقاولات" },
      { property: "og:description", content: "متابعة أرصدة الصندوق النقدي والبنك." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const { accounts, ledger } = useLedger();
  const upsert = useUpsert("accounts");
  const remove = useRemove("accounts");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Account>>({});

  const set = (k: keyof Account, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <AppShell
      title="الحسابات المالية"
      subtitle="الصندوق النقدي والبنك وأي حساب إضافي"
      action={
        <Button
          onClick={() => {
            setDraft({ type: "cash" });
            setOpen(true);
          }}
        >
          <Plus className="ml-1 h-4 w-4" /> حساب جديد
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="إجمالي السيولة" value={cashOnHand(accounts, ledger)} tone="primary" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <div key={a.id} className="card-soft p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {a.type === "bank" ? (
                  <Landmark className="h-5 w-5 text-primary" />
                ) : (
                  <Wallet className="h-5 w-5 text-primary" />
                )}
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.type === "bank" ? "حساب بنكي" : "صندوق نقدي"}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xl font-bold tabular-nums">
              {money(accountBalance(a, ledger))}
            </p>
            <p className="text-xs text-muted-foreground">
              رصيد افتتاحي: {money(a.opening_balance)}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(a);
                  setOpen(true);
                }}
              >
                <Pencil className="ml-1 h-3.5 w-3.5" /> تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!confirm("حذف الحساب؟")) return;
                  await remove.mutateAsync(a.id);
                  toast.success("تم الحذف");
                }}
              >
                <Trash2 className="ml-1 h-3.5 w-3.5" /> حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل حساب" : "حساب جديد"}
        onSubmit={async () => {
          if (!draft.name) {
            toast.error("اسم الحساب مطلوب");
            return;
          }
          await upsert.mutateAsync({
            id: draft.id,
            name: draft.name,
            type: draft.type ?? "cash",
            opening_balance: Number(draft.opening_balance ?? 0),
            notes: draft.notes ?? null,
          });
          toast.success("تم الحفظ");
          setOpen(false);
          setDraft({});
        }}
        submitting={upsert.isPending}
      >
        <Field label="اسم الحساب">
          <TextInput value={draft.name ?? ""} onChange={(v) => set("name", v)} required />
        </Field>
        <Field label="نوع الحساب">
          <Picker
            value={draft.type ?? "cash"}
            onChange={(v) => set("type", v)}
            options={[
              { value: "cash", label: "صندوق نقدي" },
              { value: "bank", label: "بنك" },
            ]}
          />
        </Field>
        <Field label="الرصيد الافتتاحي">
          <TextInput
            type="number"
            step="0.01"
            value={draft.opening_balance ?? ""}
            onChange={(v) => set("opening_balance", v)}
          />
        </Field>
        <Field label="ملاحظات" full>
          <AreaInput value={draft.notes ?? ""} onChange={(v) => set("notes", v)} />
        </Field>
      </FormDialog>
    </AppShell>
  );
}
