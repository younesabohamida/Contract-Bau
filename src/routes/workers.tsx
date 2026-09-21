import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, HandCoins, Coins, CalendarCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaInput, Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { AttachmentField } from "@/components/AttachmentField";
import { StatCard } from "@/components/StatCard";
import {
  useRemove,
  useUpsert,
  type AdvanceDraft,
  type SettlementDraft,
  type Worker,
} from "@/lib/db";
import { useLedger, toOptions } from "@/lib/useLedger";
import { workerAccount } from "@/lib/finance";
import { money, num, today } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/workers")({
  head: () => ({
    meta: [
      { title: "العمال والحرفيون — إدارة المقاولات" },
      {
        name: "description",
        content: "متابعة أجور العمال والحرفيين والمستحقات والسلف الممنوحة وتصفيتها.",
      },
      { property: "og:title", content: "العمال والحرفيون — إدارة المقاولات" },
      { property: "og:description", content: "أجور العمال والمستحقات والسلف." },
    ],
  }),
  component: WorkersPage,
});

const WAGE_TYPES = ["يومي", "بالمقطوعية", "بالمتر", "شهري"].map((w) => ({ value: w, label: w }));

function WorkersPage() {
  const { ledger, workers, accounts, projects, attendance } = useLedger();
  const upsert = useUpsert("workers");
  const remove = useRemove("workers");
  const settle = useUpsert("settlements");
  const advance = useUpsert("worker_advances");
  const markAttendance = useUpsert("worker_attendance");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Worker>>({});
  const [pay, setPay] = useState<SettlementDraft>({});
  const [adv, setAdv] = useState<AdvanceDraft>({});
  const [search, setSearch] = useState("");

  const set = (k: keyof Worker, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const rows = workers.filter((w) =>
    [w.name, w.profession, w.phone].filter(Boolean).some((v) => (v as string).includes(search)),
  );

  const thisMonthPrefix = today().slice(0, 7);
  const attendanceThisMonth = (workerId: string) =>
    attendance.filter((a) => a.worker_id === workerId && a.date.startsWith(thisMonthPrefix)).length;
  const attendedToday = (workerId: string) =>
    attendance.some((a) => a.worker_id === workerId && a.date === today());

  const totals = rows.reduce(
    (acc, w) => {
      const a = workerAccount(w, ledger);
      return {
        due: acc.due + a.due,
        paid: acc.paid + a.paid,
        remaining: acc.remaining + a.remaining,
        advances: acc.advances + a.advancesOutstanding,
      };
    },
    { due: 0, paid: 0, remaining: 0, advances: 0 },
  );

  return (
    <AppShell
      title="العمال والحرفيون"
      subtitle="الأجور والمستحقات والسلف"
      action={
        <Button
          onClick={() => {
            setDraft({});
            setOpen(true);
          }}
        >
          <Plus className="ml-1 h-4 w-4" /> عامل جديد
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatCard label="إجمالي المستحق" value={totals.due} />
        <StatCard label="المدفوع" value={totals.paid} tone="primary" />
        <StatCard label="المتبقي" value={totals.remaining} tone="danger" />
        <StatCard label="سلف قائمة" value={totals.advances} tone="warning" />
      </div>

      <Input
        placeholder="بحث بالاسم أو المهنة…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="card-soft overflow-x-auto p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المهنة</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">نوع الأجر</TableHead>
              <TableHead className="text-right">الأجر المتفق</TableHead>
              <TableHead className="text-right">أيام الحضور (الشهر)</TableHead>
              <TableHead className="text-right">إجمالي المستحق</TableHead>
              <TableHead className="text-right">المدفوع</TableHead>
              <TableHead className="text-right">المتبقي</TableHead>
              <TableHead className="text-right">سلف قائمة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((w) => {
              const a = workerAccount(w, ledger);
              return (
                <TableRow key={w.id}>
                  <TableCell className="font-semibold">{w.name}</TableCell>
                  <TableCell>{w.profession ?? "—"}</TableCell>
                  <TableCell dir="ltr">{w.phone ?? "—"}</TableCell>
                  <TableCell>{w.wage_type ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{money(w.agreed_wage)}</TableCell>
                  <TableCell>
                    {w.wage_type === "يومي" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {attendanceThisMonth(w.id)} يوم
                          <span className="text-muted-foreground">
                            {" "}
                            (≈ {money(attendanceThisMonth(w.id) * num(w.agreed_wage))})
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant={attendedToday(w.id) ? "secondary" : "outline"}
                          size="sm"
                          disabled={attendedToday(w.id)}
                          onClick={async () => {
                            await markAttendance.mutateAsync({
                              worker_id: w.id,
                              project_id: null,
                              date: today(),
                            });
                            toast.success("تم تسجيل الحضور");
                          }}
                        >
                          {attendedToday(w.id) ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <CalendarCheck className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{money(a.due)}</TableCell>
                  <TableCell className="tabular-nums text-primary">{money(a.paid)}</TableCell>
                  <TableCell className="tabular-nums text-destructive">
                    {money(a.remaining)}
                  </TableCell>
                  <TableCell className="tabular-nums text-warning">
                    {money(a.advancesOutstanding)}
                  </TableCell>
                  <TableCell>
                    <span className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPay({
                            party_type: "worker",
                            worker_id: w.id,
                            settlement_date: today(),
                            account_id: accounts[0]?.id ?? null,
                          });
                          setPayOpen(true);
                        }}
                      >
                        <HandCoins className="ml-1 h-3.5 w-3.5" /> سداد
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdv({
                            worker_id: w.id,
                            advance_date: today(),
                            account_id: accounts[0]?.id ?? null,
                          });
                          setAdvOpen(true);
                        }}
                      >
                        <Coins className="ml-1 h-3.5 w-3.5" /> سلفة
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDraft(w);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (!confirm("حذف العامل؟")) return;
                          await remove.mutateAsync(w.id);
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
                  لا يوجد عمال
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل عامل" : "عامل جديد"}
        onSubmit={async () => {
          if (!draft.name) {
            toast.error("الاسم مطلوب");
            return;
          }
          await upsert.mutateAsync({
            id: draft.id,
            name: draft.name,
            profession: draft.profession ?? null,
            phone: draft.phone ?? null,
            wage_type: draft.wage_type ?? null,
            agreed_wage: Number(draft.agreed_wage ?? 0),
            notes: draft.notes ?? null,
          });
          toast.success("تم الحفظ");
          setOpen(false);
          setDraft({});
        }}
      >
        <Field label="الاسم">
          <TextInput value={draft.name ?? ""} onChange={(v) => set("name", v)} required />
        </Field>
        <Field label="المهنة">
          <TextInput value={draft.profession ?? ""} onChange={(v) => set("profession", v)} />
        </Field>
        <Field label="الهاتف">
          <TextInput value={draft.phone ?? ""} onChange={(v) => set("phone", v)} />
        </Field>
        <Field label="نوع الأجر">
          <Picker
            value={draft.wage_type ?? null}
            onChange={(v) => set("wage_type", v)}
            allowEmpty
            options={WAGE_TYPES}
          />
        </Field>
        <Field label="الأجر المتفق عليه">
          <TextInput
            type="number"
            step="0.01"
            value={draft.agreed_wage ?? ""}
            onChange={(v) => set("agreed_wage", v)}
          />
        </Field>
        <Field label="ملاحظات" full>
          <AreaInput value={draft.notes ?? ""} onChange={(v) => set("notes", v)} />
        </Field>
      </FormDialog>

      <FormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="سداد مستحقات عامل"
        description="السداد يقلل المستحقات؛ إذا كان خصماً من سلفة سابقة فلن يُخصم من السيولة."
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
        <Field label="خصم من سلفة سابقة" full hint="لا يخرج نقداً من الحساب">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pay.uses_advance ?? false}
              onChange={(e) => setPay((p) => ({ ...p, uses_advance: e.target.checked }))}
            />
            تصفية مقابل سلفة مصروفة سابقاً
          </label>
        </Field>
        <div className="sm:col-span-2">
          <AttachmentField
            label="سند الصرف"
            value={pay.attachment_path ?? null}
            onChange={(p) => setPay((prev) => ({ ...prev, attachment_path: p }))}
          />
        </div>
      </FormDialog>

      <FormDialog
        open={advOpen}
        onOpenChange={setAdvOpen}
        title="منح سلفة لعامل"
        description="السلفة تخرج من السيولة ولا تُحتسب كمصروف، وتُصفّى لاحقاً من مستحقات العامل."
        onSubmit={async () => {
          if (!adv.amount) {
            toast.error("المبلغ مطلوب");
            return;
          }
          await advance.mutateAsync({ ...adv, amount: Number(adv.amount) });
          toast.success("تم تسجيل السلفة");
          setAdvOpen(false);
          setAdv({});
        }}
      >
        <Field label="المبلغ">
          <TextInput
            type="number"
            step="0.01"
            value={adv.amount ?? ""}
            onChange={(v) => setAdv((p) => ({ ...p, amount: v }))}
            required
          />
        </Field>
        <Field label="التاريخ">
          <TextInput
            type="date"
            value={adv.advance_date ?? today()}
            onChange={(v) => setAdv((p) => ({ ...p, advance_date: v }))}
          />
        </Field>
        <Field label="الحساب المالي">
          <Picker
            value={adv.account_id ?? null}
            onChange={(v) => setAdv((p) => ({ ...p, account_id: v }))}
            allowEmpty
            options={toOptions(accounts)}
          />
        </Field>
        <Field label="المشروع">
          <Picker
            value={adv.project_id ?? null}
            onChange={(v) => setAdv((p) => ({ ...p, project_id: v }))}
            allowEmpty
            options={toOptions(projects)}
          />
        </Field>
        <Field label="ملاحظات" full>
          <AreaInput
            value={adv.notes ?? ""}
            onChange={(v) => setAdv((p) => ({ ...p, notes: v }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <AttachmentField
            label="سند السلفة"
            value={adv.attachment_path ?? null}
            onChange={(p) => setAdv((prev) => ({ ...prev, attachment_path: p }))}
          />
        </div>
      </FormDialog>
    </AppShell>
  );
}
