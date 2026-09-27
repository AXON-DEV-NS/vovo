"use client";

import { forwardRef, type HTMLAttributes, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, open, onClose, title, description, size = "md", children, ...props }, ref) => {
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      },
      [onClose]
    );

    useEffect(() => {
      if (open) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [open, handleEscape]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
          className={cn(
            "relative z-50 w-full rounded-2xl bg-paper-high p-6 shadow-soft-lg animate-fade-in",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-ink-faint hover:bg-paper-low hover:text-ink-soft transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold text-ink mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p id="modal-description" className="text-sm text-ink-mute mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";

export { Modal };
