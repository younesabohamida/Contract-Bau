import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shareViaWhatsApp } from "@/lib/whatsapp";

export function WhatsAppShareButton({
  text,
  label,
  size = "icon",
  variant = "ghost",
}: {
  text: string | (() => string);
  label?: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      title="مشاركة عبر واتساب"
      onClick={() => shareViaWhatsApp(typeof text === "function" ? text() : text)}
    >
      <MessageCircle className={label ? "ml-1 h-3.5 w-3.5" : "h-3.5 w-3.5"} />
      {label}
    </Button>
  );
}
