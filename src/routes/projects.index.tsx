import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AreaInput, Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { useRemove, useRows, useUpsert, type Project } from "@/lib/db";
import { DEFAULT_ITEMS, PROJECT_STATUS, formatDate, money, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "المشاريع — إدارة المقاولات والتشطيبات" },
      {
        name: "description",
        content: "إنشاء ومتابعة مشاريع المقاولات والتشطيبات مع الميزانيات وحالة التنفيذ.",
      },
      { property: "og:title", content: "المشاريع — إدارة المقاولات والتشطيبات" },
      { property: "og:description", content: "إنشاء ومتابعة مشاريع المقاولات والتشطيبات." },
    ],
  }),
  component: ProjectsPage,
});

type Draft = Partial<Project> & { id?: string };

function ProjectsPage() {
  const { data: projects = [] } = useRows<Project>("projects");
  const upsert = useUpsert("projects");
  const upsertItem = useUpsert("project_items");
  const remove = useRemove("projects");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft>({});
  const [seedItems, setSeedItems] = useState(true);

  const set = (k: keyof Project, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const filtered = projects.filter((p) =>
    [p.name, p.client_name, p.code, p.address]
      .filter(Boolean)
      .some((v) => (v as string).includes(search)),
  );

  const save = async () => {
    if (!draft.name) {
      toast.error("اسم المشروع مطلوب");
      return;
    }
    const isNew = !draft.id;
    const saved = (await upsert.mutateAsync({
      id: draft.id,
      name: draft.name,
      client_name: draft.client_name ?? null,
      address: draft.address ?? null,
      code: draft.code ?? null,
      start_date: draft.start_date || null,
      expected_end_date: draft.expected_end_date || null,
      budget: Number(draft.budget ?? 0),
      description: draft.description ?? null,
      status: draft.status ?? "in_progress",
    })) as Project;
    if (isNew && seedItems) {
      for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
        await upsertItem.mutateAsync({
          project_id: saved.id,
          name: DEFAULT_ITEMS[i],
          sort_order: i,
          estimated_cost: 0,
          notes: null,
        });
      }
    }
    toast.success("تم حفظ المشروع");
    setOpen(false);
    setDraft({});
  };

  return (
    <AppShell
      title="المشاريع"
      subtitle="إدارة المشاريع وبنود الأعمال"
      action={
        <Button
          onClick={() => {
            setDraft({ status: "in_progress" });
            setSeedItems(true);
            setOpen(true);
          }}
        >
          <Plus className="ml-1 h-4 w-4" /> مشروع جديد
        </Button>
      }
    >
      <Input
        placeholder="بحث باسم المشروع أو العميل أو الكود…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="card-soft flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="text-lg font-bold text-primary hover:underline"
                >
                  {p.name}
                </Link>
                <p className="text-sm text-muted-foreground">{p.client_name ?? "بدون عميل"}</p>
              </div>
              <Badge variant={p.status === "completed" ? "secondary" : "default"}>
                {statusLabel(p.status)}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-1 text-sm">
              <dt className="text-muted-foreground">الكود</dt>
              <dd>{p.code ?? "—"}</dd>
              <dt className="text-muted-foreground">الميزانية</dt>
              <dd className="tabular-nums">{money(p.budget)}</dd>
              <dt className="text-muted-foreground">البداية</dt>
              <dd>{formatDate(p.start_date)}</dd>
              <dt className="text-muted-foreground">الانتهاء المتوقع</dt>
              <dd>{formatDate(p.expected_end_date)}</dd>
            </dl>
            <div className="mt-1 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(p);
                  setSeedItems(false);
                  setOpen(true);
                }}
              >
                <Pencil className="ml-1 h-3.5 w-3.5" /> تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!confirm("حذف المشروع وكل بنوده؟")) return;
                  await remove.mutateAsync(p.id);
                  toast.success("تم الحذف");
                }}
              >
                <Trash2 className="ml-1 h-3.5 w-3.5" /> حذف
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد مشاريع مطابقة.</p>
        ) : null}
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل مشروع" : "مشروع جديد"}
        onSubmit={save}
        submitting={upsert.isPending}
      >
        <Field label="اسم المشروع">
          <TextInput value={draft.name ?? ""} onChange={(v) => set("name", v)} required />
        </Field>
        <Field label="اسم العميل / الممول">
          <TextInput value={draft.client_name ?? ""} onChange={(v) => set("client_name", v)} />
        </Field>
        <Field label="كود / رقم المشروع">
          <TextInput value={draft.code ?? ""} onChange={(v) => set("code", v)} />
        </Field>
        <Field label="عنوان المشروع">
          <TextInput value={draft.address ?? ""} onChange={(v) => set("address", v)} />
        </Field>
        <Field label="تاريخ البداية">
          <TextInput
            type="date"
            value={draft.start_date ?? ""}
            onChange={(v) => set("start_date", v)}
          />
        </Field>
        <Field label="تاريخ الانتهاء المتوقع">
          <TextInput
            type="date"
            value={draft.expected_end_date ?? ""}
            onChange={(v) => set("expected_end_date", v)}
          />
        </Field>
        <Field label="الميزانية">
          <TextInput
            type="number"
            step="0.01"
            value={draft.budget ?? ""}
            onChange={(v) => set("budget", v)}
          />
        </Field>
        <Field label="حالة المشروع">
          <Picker
            value={draft.status ?? "in_progress"}
            onChange={(v) => set("status", v)}
            options={PROJECT_STATUS.map((s) => ({ value: s.value, label: s.label }))}
          />
        </Field>
        <Field label="الوصف" full>
          <AreaInput value={draft.description ?? ""} onChange={(v) => set("description", v)} />
        </Field>
        {!draft.id ? (
          <Field label="البنود الافتراضية" full hint="هدم، لياسة، بلاط، دهان، جبس، كهرباء…">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={seedItems}
                onChange={(e) => setSeedItems(e.target.checked)}
              />
              إضافة بنود الأعمال الافتراضية تلقائياً
            </label>
          </Field>
        ) : null}
      </FormDialog>
    </AppShell>
  );
}
