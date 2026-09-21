import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Field, FormDialog, Picker, TextInput } from "@/components/form-kit";
import { useRemove, useRows, useUpsert, type Category } from "@/lib/db";
import { MAIN_CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "التصنيفات — إدارة المقاولات" },
      {
        name: "description",
        content: "التصنيفات الرئيسية والفرعية للمصروفات: مواد، أجور، خدمات، تشغيل.",
      },
      { property: "og:title", content: "التصنيفات — إدارة المقاولات" },
      { property: "og:description", content: "إدارة تصنيفات المصروفات الرئيسية والفرعية." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories = [] } = useRows<Category>("categories", "name", true);
  const upsert = useUpsert("categories");
  const remove = useRemove("categories");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Category>>({});

  return (
    <AppShell
      title="التصنيفات"
      subtitle="تصنيفات المصروفات الرئيسية والفرعية"
      action={
        <Button
          onClick={() => {
            setDraft({ main_category: "materials" });
            setOpen(true);
          }}
        >
          <Plus className="ml-1 h-4 w-4" /> تصنيف فرعي جديد
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {MAIN_CATEGORIES.map((main) => (
          <section key={main.value} className="card-soft p-4">
            <h2 className="mb-3 text-base font-bold">{main.label}</h2>
            <ul className="space-y-1">
              {categories
                .filter((c) => c.main_category === main.value)
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
                  >
                    <span>{c.name}</span>
                    <span className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDraft(c);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (!confirm("حذف التصنيف؟")) return;
                          await remove.mutateAsync(c.id);
                          toast.success("تم الحذف");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </span>
                  </li>
                ))}
              {categories.filter((c) => c.main_category === main.value).length === 0 ? (
                <li className="text-sm text-muted-foreground">لا توجد تصنيفات</li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={draft.id ? "تعديل تصنيف" : "تصنيف فرعي جديد"}
        onSubmit={async () => {
          if (!draft.name) {
            toast.error("اسم التصنيف مطلوب");
            return;
          }
          await upsert.mutateAsync({
            id: draft.id,
            name: draft.name,
            main_category: draft.main_category ?? "materials",
          });
          toast.success("تم الحفظ");
          setOpen(false);
          setDraft({});
        }}
        submitting={upsert.isPending}
      >
        <Field label="التصنيف الرئيسي">
          <Picker
            value={draft.main_category ?? "materials"}
            onChange={(v) => setDraft((d) => ({ ...d, main_category: v as Category["main_category"] }))}
            options={MAIN_CATEGORIES.map((m) => ({ value: m.value, label: m.label }))}
          />
        </Field>
        <Field label="اسم التصنيف الفرعي">
          <TextInput
            value={draft.name ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            required
          />
        </Field>
      </FormDialog>
    </AppShell>
  );
}
