"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export function InfoButton({ variant = "corner" }: { variant?: "corner" | "inline" | "small" }) {
  const t = useTranslations("info");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      {variant === "corner" ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 right-4 sm:top-5 sm:right-5 md:top-7 md:right-7 z-40 w-8 h-8 flex items-center justify-center rounded-full border border-[var(--foreground)]/20 text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:border-[var(--foreground)]/40 transition-colors text-sm"
          aria-label={t("label")}
        >
          ?
        </button>
      ) : variant === "small" ? (
        <button
          onClick={() => setOpen(true)}
          className="w-6 h-6 flex items-center justify-center rounded-full border border-[var(--foreground)]/20 text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:border-[var(--foreground)]/40 transition-colors text-xs"
          aria-label={t("label")}
        >
          ?
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="px-8 py-3 border border-[var(--foreground)]/30 hover:border-[var(--foreground)]/60 text-[var(--foreground)]/70 hover:text-[var(--foreground)] text-sm rounded transition-colors"
        >
          {t("label")}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            ref={panelRef}
            className="bg-[#1a1a1a] border border-[var(--foreground)]/10 rounded-lg max-w-md w-full mx-6 p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-[var(--foreground)]/90">{t("title")}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 transition-colors text-lg"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm text-[var(--foreground)]/60 leading-relaxed">
              <p>{t("about")}</p>
              <p>{t("anonymous")}</p>

              <div className="border-t border-[var(--foreground)]/10 pt-4">
                <h3 className="text-xs uppercase tracking-widest text-[var(--foreground)]/40 mb-2">{t("moderationTitle")}</h3>
                <p>{t("moderation")}</p>
              </div>

              <div className="border-t border-[var(--foreground)]/10 pt-4">
                <h3 className="text-xs uppercase tracking-widest text-[var(--foreground)]/40 mb-2">{t("removalTitle")}</h3>
                <p>{t("removal")}</p>
              </div>

              <div className="border-t border-[var(--foreground)]/10 pt-4 text-xs text-[var(--foreground)]/30">
                <p>{t("nonCommercial")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
