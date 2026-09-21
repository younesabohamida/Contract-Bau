// تخزين محلي كامل داخل الجهاز عبر IndexedDB — لا يوجد أي اتصال بالإنترنت أو خادم خارجي.
// آمن للتشغيل على الخادم (SSR) لأن كل دالة تتحقق أولاً من وجود indexedDB في البيئة الحالية.

const DB_NAME = "contracting_app_db";
const DB_VERSION = 2;

export const STORES = [
  "projects",
  "project_items",
  "accounts",
  "categories",
  "workers",
  "suppliers",
  "receipts",
  "expenses",
  "worker_advances",
  "settlements",
  "worker_attendance",
] as const;

export type StoreName = (typeof STORES)[number];

const ATTACHMENTS_STORE = "attachments";

function hasIndexedDB() {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!hasIndexedDB()) {
    return Promise.reject(new Error("indexedDB غير متاح في هذه البيئة"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
      if (!db.objectStoreNames.contains(ATTACHMENTS_STORE)) {
        db.createObjectStore(ATTACHMENTS_STORE, { keyPath: "path" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  if (!hasIndexedDB()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getById<T>(store: StoreName, id: string): Promise<T | undefined> {
  if (!hasIndexedDB()) return undefined;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function put<T extends { id: string }>(store: StoreName, value: T): Promise<T> {
  if (!hasIndexedDB()) throw new Error("indexedDB غير متاح");
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeById(store: StoreName, id: string): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(store: StoreName): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ===== المرفقات (صور الفواتير) — تُحفظ كملفات ثنائية داخل IndexedDB =====

export type StoredAttachment = {
  path: string;
  blob: Blob;
  type: string;
  createdAt: string;
};

export async function putAttachment(file: Blob, ext: string): Promise<string> {
  if (!hasIndexedDB()) throw new Error("indexedDB غير متاح");
  const path = `${crypto.randomUUID()}.${ext}`;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ATTACHMENTS_STORE, "readwrite");
    tx.objectStore(ATTACHMENTS_STORE).put({
      path,
      blob: file,
      type: file.type,
      createdAt: new Date().toISOString(),
    } satisfies StoredAttachment);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return path;
}

export async function getAttachment(path: string): Promise<StoredAttachment | undefined> {
  if (!hasIndexedDB()) return undefined;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENTS_STORE, "readonly");
    const req = tx.objectStore(ATTACHMENTS_STORE).get(path);
    req.onsuccess = () => resolve(req.result as StoredAttachment | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function removeAttachment(path: string): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENTS_STORE, "readwrite");
    tx.objectStore(ATTACHMENTS_STORE).delete(path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllAttachments(): Promise<StoredAttachment[]> {
  if (!hasIndexedDB()) return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENTS_STORE, "readonly");
    const req = tx.objectStore(ATTACHMENTS_STORE).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as StoredAttachment[]);
    req.onerror = () => reject(req.error);
  });
}
