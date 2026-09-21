import * as local from "@/lib/localdb";
import type { Account, Category } from "@/lib/db";

const DEFAULT_ACCOUNTS: Array<Pick<Account, "name" | "type" | "opening_balance">> = [
  { name: "الصندوق النقدي", type: "cash", opening_balance: 0 },
  { name: "البنك", type: "bank", opening_balance: 0 },
];

const DEFAULT_CATEGORIES: Array<Pick<Category, "main_category" | "name">> = [
  { main_category: "materials", name: "بلاط" },
  { main_category: "materials", name: "إسمنت" },
  { main_category: "materials", name: "رمل" },
  { main_category: "materials", name: "دهان" },
  { main_category: "materials", name: "جبس" },
  { main_category: "materials", name: "أدوات صحية" },
  { main_category: "materials", name: "مواد كهربائية" },
  { main_category: "materials", name: "ألواح طاقة" },
  { main_category: "wages", name: "مبلط" },
  { main_category: "wages", name: "دهان" },
  { main_category: "wages", name: "كهربائي" },
  { main_category: "wages", name: "سباك" },
  { main_category: "wages", name: "نجار" },
  { main_category: "wages", name: "عامل" },
  { main_category: "services", name: "نقل" },
  { main_category: "services", name: "ترحيل مخلفات" },
  { main_category: "services", name: "تنظيف" },
  { main_category: "services", name: "تحميل وتنزيل" },
  { main_category: "services", name: "استئجار معدات" },
  { main_category: "operations", name: "وقود" },
  { main_category: "operations", name: "مواصلات" },
  { main_category: "operations", name: "هاتف" },
  { main_category: "operations", name: "مياه" },
  { main_category: "operations", name: "كهرباء" },
  { main_category: "operations", name: "مصروف يومي" },
  { main_category: "operations", name: "طوارئ" },
];

const SEED_FLAG_KEY = "app.seeded.v1";

/** يزرع الحسابات والتصنيفات الافتراضية أول مرة فقط، ولا يفعل شيئاً بعد ذلك. */
export async function ensureSeedData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG_KEY)) return;

  const existingAccounts = await local.getAll("accounts");
  const now = new Date().toISOString();

  if (existingAccounts.length === 0) {
    for (const a of DEFAULT_ACCOUNTS) {
      await local.put("accounts", {
        id: crypto.randomUUID(),
        is_active: true,
        notes: null,
        created_at: now,
        updated_at: now,
        ...a,
      });
    }
  }

  const existingCategories = await local.getAll("categories");
  if (existingCategories.length === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      await local.put("categories", {
        id: crypto.randomUUID(),
        is_active: true,
        created_at: now,
        updated_at: now,
        ...c,
      });
    }
  }

  localStorage.setItem(SEED_FLAG_KEY, "1");
}
