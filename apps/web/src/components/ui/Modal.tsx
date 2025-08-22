// apps/web/src/components/ui/Modal.tsx
import * as React from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  /** Click outside to close (default: true) */
  closeOnBackdrop?: boolean;
  /** Press Escape to close (default: true) */
  closeOnEsc?: boolean;
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function ensurePortalRoot() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById("modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "modal-root";
    document.body.appendChild(el);
  }
  return el;
}

export function Modal({
  open,
  onClose,
  title,
  footer,
  size = "lg",
  children,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = "",
}: ModalProps) {
  const portal = ensurePortalRoot();

  // Body scroll lock
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close
  React.useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  if (!open || !portal) return null;

  return createPortal(
    // Wrapper: clicking anywhere in wrapper (not in the sheet) will close
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={() => {
        if (closeOnBackdrop) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet (stop click from bubbling to wrapper) */}
      <div
        className={`relative w-full ${SIZE_CLASS[size]} mx-3 rounded-xl bg-white shadow-lg border ${className}`}
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="sticky top-0 z-10 px-4 py-3 border-b bg-white rounded-t-xl flex items-center justify-between">
            <div className="font-medium">{title}</div>
            <button
              aria-label="Close modal"
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body (scrollable) */}
        <div
          className="px-4 py-4 overflow-auto"
          style={{ maxHeight: "calc(85vh - 6rem)" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 z-10 px-4 py-3 border-t bg-white rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portal
  );
}

export default Modal;
