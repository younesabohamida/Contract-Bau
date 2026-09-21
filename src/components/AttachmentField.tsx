import { useEffect, useRef, useState } from "react";
import { Camera, Paperclip, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getAttachment, putAttachment } from "@/lib/localdb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** يبني رابط عرض مؤقت للمرفق من IndexedDB (بدون أي اتصال بالإنترنت). */
export async function attachmentUrl(path: string) {
  const record = await getAttachment(path);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

export function AttachmentField({
  value,
  onChange,
  label = "صورة الإثبات / الفاتورة",
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = await putAttachment(file, ext);
      onChange(path);
      toast.success("تم حفظ المرفق على الجهاز");
    } catch {
      toast.error("تعذّر حفظ المرفق");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">مرفق محفوظ على الجهاز</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="ml-1 h-4 w-4" /> التقاط صورة
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="ml-1 h-4 w-4" /> اختيار ملف
          </Button>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        </div>
      )}
    </div>
  );
}

export function AttachmentLink({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    if (path) {
      attachmentUrl(path).then((u) => {
        objectUrl = u;
        setUrl(u);
      });
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  if (!path) return <span className="text-muted-foreground">—</span>;
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-primary underline"
    >
      <Paperclip className="h-3.5 w-3.5" /> معاينة
    </a>
  ) : (
    <span className="text-muted-foreground">…</span>
  );
}
