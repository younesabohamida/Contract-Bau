/** يفتح واتساب (أو نافذة مشاركة الجهاز) مع نص جاهز، والمستخدم يختار جهة الإرسال بنفسه. */
export function shareViaWhatsApp(text: string) {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    navigator.share({ text }).catch(() => {
      openWaMe(text);
    });
    return;
  }
  openWaMe(text);
}

function openWaMe(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
