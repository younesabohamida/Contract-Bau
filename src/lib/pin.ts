const PIN_KEY = "app.pin.hash";

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hasPinSet(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(PIN_KEY);
}

export async function setPin(pin: string) {
  localStorage.setItem(PIN_KEY, await hashPin(pin));
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return true;
  return (await hashPin(pin)) === stored;
}
