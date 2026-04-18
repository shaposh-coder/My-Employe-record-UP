"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Primary action label (e.g. "Delete", "Remove", "OK"). */
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Use red styling for the confirm button (destructive actions). */
  variant?: "danger" | "default";
};

/**
 * Modal confirmation — use for delete and other irreversible actions instead of `window.confirm`.
 * Fixed overlay at `z-[400]` so it stacks above most app modals.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const confirmBtnClass =
    variant === "danger"
      ? "rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:focus-visible:outline-red-500"
      : "rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white";

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center px-4 py-8 sm:px-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] dark:bg-black/65"
        aria-label="Cancel"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="pr-8 text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label={cancelLabel}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        {description ? (
          <div
            id={descId}
            className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
          >
            {description}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            onClick={() => {
              void onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
