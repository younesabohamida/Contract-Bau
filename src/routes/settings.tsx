import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, Lock, LockOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormDialog } from "@/components/form-kit";
import { exportBackup, getLastBackupAt, importBackup } from "@/lib/backup";
import { hasPinSet, setPin, clearPin } from "@/lib/pin";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — إدارة المقاولات" },
      { name: "description", content: "النسخ الاحتياطي واستعادة البيانات وقفل التطبيق." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [locked, setLocked] = useState(() => hasPinSet());
  const lastBackup = getLastBackupAt();

  return (
    <AppShell title="الإعدادات" subtitle="النسخ الاحتياطي وقفل التطبيق">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-soft space-y-4 p-4">
          <div>
            <h2 className="text-base font-bold">النسخ الاحتياطي</h2>
            <p className="text-sm text-muted-foreground">
              كل البيانات محفوظة على هذا الجهاز فقط. صدّر نسخة بشكل دوري لتفادي فقدانها.
            </p>
          </div>
          <p className="text-sm">
            آخر نسخة احتياطية:{" "}
            <span className="font-semibold">
              {lastBackup ? formatDate(lastBackup.slice(0, 10)) : "لم تُصدَّر بعد"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await exportBackup();
                  toast.success("تم تجهيز النسخة الاحتياطية");
                } catch {
                  toast.error("تعذّر تصدير النسخة الاحتياطية");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download className="ml-1 h-4 w-4" /> تصدير نسخة احتياطية
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  !confirm(
                    "استيراد نسخة احتياطية سيستبدل كل البيانات الحالية على هذا الجهاز. متابعة؟",
                  )
                ) {
                  e.target.value = "";
                  return;
                }
                setBusy(true);
                try {
                  await importBackup(file);
                  toast.success("تم استيراد البيانات، أعد فتح التطبيق");
                } catch {
                  toast.error("ملف النسخة الاحتياطية غير صالح");
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
            <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="ml-1 h-4 w-4" /> استيراد نسخة احتياطية
            </Button>
          </div>
        </section>

        <section className="card-soft space-y-4 p-4">
          <div>
            <h2 className="text-base font-bold">قفل التطبيق</h2>
            <p className="text-sm text-muted-foreground">
              رمز قفل بسيط (أرقام) يُطلب عند فتح التطبيق، مستقل عن أي حساب.
            </p>
          </div>
          <p className="text-sm">
            الحالة الحالية:{" "}
            <span className="font-semibold">{locked ? "القفل مفعّل" : "بدون قفل"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPinValue("");
                setPinConfirm("");
                setPinOpen(true);
              }}
            >
              <Lock className="ml-1 h-4 w-4" /> {locked ? "تغيير الرمز" : "تفعيل قفل بالرمز"}
            </Button>
            {locked ? (
              <Button
                variant="ghost"
                onClick={() => {
                  if (!confirm("إلغاء قفل التطبيق؟")) return;
                  clearPin();
                  setLocked(false);
                  toast.success("تم إلغاء القفل");
                }}
              >
                <LockOpen className="ml-1 h-4 w-4" /> إلغاء القفل
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      <FormDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="تعيين رمز القفل"
        description="4 أرقام على الأقل. لا يمكن استرجاع الرمز إن نُسي، فقط إلغاء القفل من هذه الصفحة."
        onSubmit={async () => {
          if (pinValue.length < 4) {
            toast.error("الرمز يجب أن يكون 4 أرقام على الأقل");
            return;
          }
          if (pinValue !== pinConfirm) {
            toast.error("الرمزان غير متطابقين");
            return;
          }
          await setPin(pinValue);
          setLocked(true);
          setPinOpen(false);
          toast.success("تم تفعيل القفل");
        }}
      >
        <Field label="الرمز">
          <Input
            type="password"
            inputMode="numeric"
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
          />
        </Field>
        <Field label="تأكيد الرمز">
          <Input
            type="password"
            inputMode="numeric"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value)}
          />
        </Field>
      </FormDialog>
    </AppShell>
  );
}
