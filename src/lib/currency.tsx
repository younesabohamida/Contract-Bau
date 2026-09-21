import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CurrencyCode = "USD" | "EUR" | "SYP" | "SAR" | "AED" | "TRY";

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "دولار أمريكي ($)" },
  { code: "EUR", symbol: "€", label: "يورو (€)" },
  { code: "SYP", symbol: "ل.س", label: "ليرة سورية (ل.س)" },
  { code: "SAR", symbol: "ر.س", label: "ريال سعودي (ر.س)" },
  { code: "AED", symbol: "د.إ", label: "درهم إماراتي (د.إ)" },
  { code: "TRY", symbol: "₺", label: "ليرة تركية (₺)" },
];

const STORAGE_KEY = "app.currency";
const DEFAULT_CODE: CurrencyCode = "USD";

// Module-level active currency so the plain `money()` helper stays synchronous.
let activeCode: CurrencyCode = DEFAULT_CODE;

export const currencySymbol = (code: CurrencyCode = activeCode) =>
  CURRENCIES.find((c) => c.code === code)?.symbol ?? code;

export const getCurrencyCode = () => activeCode;

export const readStoredCurrency = (): CurrencyCode => {
  if (typeof window === "undefined") return DEFAULT_CODE;
  const stored = window.localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
  return stored && CURRENCIES.some((c) => c.code === stored) ? stored : DEFAULT_CODE;
};

type CurrencyState = {
  code: CurrencyCode;
  symbol: string;
  setCode: (code: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyState>({
  code: DEFAULT_CODE,
  symbol: currencySymbol(DEFAULT_CODE),
  setCode: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<CurrencyCode>(DEFAULT_CODE);

  useEffect(() => {
    const stored = readStoredCurrency();
    activeCode = stored;
    setCodeState(stored);
  }, []);

  const value = useMemo<CurrencyState>(
    () => ({
      code,
      symbol: currencySymbol(code),
      setCode: (next) => {
        activeCode = next;
        if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
        setCodeState(next);
      },
    }),
    [code],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {/* Keyed so every amount formatted through money() re-renders on currency change. */}
      <Fragment key={code}>{children}</Fragment>
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
