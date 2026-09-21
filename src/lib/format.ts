import { currencySymbol } from "./currency";

export const currency = (n: number | null | undefined) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(
    Number(n ?? 0),
  );

export const money = (n: number | null | undefined) => `${currency(n)} ${currencySymbol()}`;

export const num = (v: unknown) => Number(v ?? 0);

export const formatDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return d;
  }
};

export const today = () => new Date().toISOString().slice(0, 10);

export const MAIN_CATEGORIES = [
  { value: "materials", label: "مواد" },
  { value: "wages", label: "أجور" },
  { value: "services", label: "خدمات" },
  { value: "operations", label: "تشغيل" },
] as const;

export const mainCategoryLabel = (v: string | null | undefined) =>
  MAIN_CATEGORIES.find((c) => c.value === v)?.label ?? "—";

export const PROJECT_STATUS = [
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "on_hold", label: "متوقف" },
  { value: "completed", label: "مكتمل" },
] as const;

export const statusLabel = (v: string | null | undefined) =>
  PROJECT_STATUS.find((s) => s.value === v)?.label ?? "—";

export const PARTY_TYPES = [
  { value: "worker", label: "عامل" },
  { value: "supplier", label: "مورد" },
  { value: "other", label: "جهة أخرى" },
] as const;

export const DEFAULT_ITEMS = [
  "هدم",
  "لياسة",
  "بلاط",
  "دهان",
  "جبس",
  "كهرباء",
  "صحية",
  "ألمنيوم",
  "أبواب",
  "مطابخ",
  "أعمال خارجية",
  "تنظيف وتسليم",
];
