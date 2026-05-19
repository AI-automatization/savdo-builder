"use client";

import { useEffect, useRef } from "react";
import { colors } from "@/lib/styles";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** danger=true → красная подтверждающая кнопка (для destructive actions) */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Доступная confirm-модалка для web-buyer: Esc закрывает, focus заперт внутри
 * (Tab/Shift+Tab циклятся), role=dialog + aria-modal. Замена inline-оверлеев
 * в чатах (WEB-QA-аудит 15.05 — модалки без Esc/focus-trap).
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: "rgba(15,17,21,0.5)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="rounded-lg p-5 max-w-xs w-full flex flex-col gap-3"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <p id="confirm-modal-title" className="text-sm font-semibold" style={{ color: colors.textStrong }}>
          {title}
        </p>
        {message && (
          <p className="text-xs" style={{ color: colors.textMuted }}>
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
            style={{ background: colors.surfaceMuted, color: colors.textBody, border: `1px solid ${colors.border}` }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
            style={
              danger
                ? { background: colors.danger, color: colors.brandTextOnBg }
                : { background: colors.brand, color: colors.brandTextOnBg }
            }
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
