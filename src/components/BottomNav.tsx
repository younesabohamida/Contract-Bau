import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Truck,
  Wallet,
  Tags,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const MAIN = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/projects", label: "المشاريع", icon: Building2 },
  { to: "/expenses", label: "المصروفات", icon: ArrowUpCircle },
  { to: "/receipts", label: "المقبوضات", icon: ArrowDownCircle },
] as const;

const MORE = [
  { to: "/workers", label: "العمال والحرفيون", icon: Users },
  { to: "/suppliers", label: "الموردون", icon: Truck },
  { to: "/accounts", label: "الحسابات المالية", icon: Wallet },
  { to: "/categories", label: "التصنيفات", icon: Tags },
  { to: "/settings", label: "الإعدادات والنسخ الاحتياطي", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const moreActive = MORE.some((m) => isActive(m.to));

  return (
    <>
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="grid grid-cols-5">
          {MAIN.map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              المزيد
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-right">المزيد</SheetTitle>
          </SheetHeader>
          <ul className="mt-2 grid grid-cols-3 gap-3 pb-4">
            {MORE.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center text-xs font-medium",
                    isActive(item.to) ? "border-primary text-primary" : "text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
