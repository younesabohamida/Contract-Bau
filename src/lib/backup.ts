import { STORES, clearStore, getAll, put, type StoreName } from "@/lib/localdb";

const LAST_BACKUP_KEY = "app.lastBackupAt";

export function getLastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_BACKUP_KEY);
}

function markBackedUp() {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

type BackupFile = {
  app: "contracting-app";
  version: 1;
  exportedAt: string;
  tables: Partial<Record<StoreName, unknown[]>>;
};

async function buildBackup(): Promise<BackupFile> {
  const tables: Partial<Record<StoreName, unknown[]>> = {};
  for (const store of STORES) {
    tables[store] = await getAll(store);
  }
  return {
    app: "contracting-app",
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** يصدّر كل البيانات كملف JSON واحد، ويحاول مشاركته مباشرة (واتساب مثلاً) قبل تنزيله. */
export async function exportBackup() {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const filename = `نسخة-احتياطية-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([json], filename, { type: "application/json" });

  let shared = false;
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: "نسخة احتياطية" });
      shared = true;
    } catch {
      shared = false;
    }
  }

  if (!shared) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  markBackedUp();
}

/** يستبدل كل البيانات الحالية بمحتوى ملف نسخة احتياطية سابق. */
export async function importBackup(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupFile;
  if (parsed.app !== "contracting-app" || !parsed.tables) {
    throw new Error("ملف غير صالح");
  }
  for (const store of STORES) {
    const rows = parsed.tables[store];
    await clearStore(store);
    if (Array.isArray(rows)) {
      for (const row of rows) {
        await put(store, row as { id: string });
      }
    }
  }
}
