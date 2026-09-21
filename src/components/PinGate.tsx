import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasPinSet, verifyPin } from "@/lib/pin";

export function PinGate({ children }: { children: ReactNode }) {
  const [needsCheck, setNeedsCheck] = useState(true);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setLocked(hasPinSet());
    setNeedsCheck(false);
  }, []);

  if (needsCheck) return null;

  if (!locked) return <>{children}</>;

  const submit = async () => {
    setChecking(true);
    const ok = await verifyPin(pin);
    setChecking(false);
    if (ok) {
      setLocked(false);
    } else {
      toast.error("رمز غير صحيح");
      setPin("");
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold">التطبيق مقفل</h1>
        <p className="text-sm text-muted-foreground">أدخل رمز القفل للمتابعة</p>
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="text-center text-lg tracking-[0.5em]"
          maxLength={8}
        />
        <Button className="w-full" disabled={checking || !pin} onClick={submit}>
          فتح
        </Button>
      </div>
    </div>
  );
}
