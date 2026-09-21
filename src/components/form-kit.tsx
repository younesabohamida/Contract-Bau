import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitting,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  submitting?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  children,
  full,
  hint,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  step,
}: {
  value: string | number | null;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <Input
      type={type}
      step={step}
      required={required}
      placeholder={placeholder}
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function AreaInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2} />;
}

export function Picker({
  value,
  onChange,
  options,
  placeholder = "اختر…",
  allowEmpty,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  return (
    <Select
      value={value ?? "__none"}
      onValueChange={(v) => onChange(v === "__none" ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {allowEmpty ? <SelectItem value="__none">بدون</SelectItem> : null}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
