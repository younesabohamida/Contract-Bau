import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelect() {
  const { code, setCode } = useCurrency();

  return (
    <Select value={code} onValueChange={(v) => setCode(v as CurrencyCode)}>
      <SelectTrigger className="h-9 w-[150px]" aria-label="العملة">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
