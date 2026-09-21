import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  Building2,
  LayoutDashboard,
  Users,
  Truck,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Tags,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencySelect } from "@/components/CurrencySelect";
import { BottomNav } from "@/components/BottomNav";

const NAV = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/projects", label: "المشاريع", icon: Building2 },
  { to: "/receipts", label: "المقبوضات", icon: ArrowDownCircle },
  { to: "/expenses", label: "المصروفات", icon: ArrowUpCircle },
  { to: "/workers", label: "العمال", icon: Users },
  { to: "/suppliers", label: "الموردون", icon: Truck },
  { to: "/accounts", label: "الحسابات", icon: Wallet },
  { to: "/categories", label: "التصنيفات", icon: Tags },
  { to: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">إدارة المقاولات والتشطيبات</p>
              <p className="text-xs text-muted-foreground">المحاسبة الميدانية</p>
            </div>
          </div>
          <CurrencySelect />
        </div>
        <nav className="mx-auto hidden max-w-7xl overflow-x-auto px-2 pb-2 md:block">
          <ul className="flex gap-1">
            {NAV.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </div>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
