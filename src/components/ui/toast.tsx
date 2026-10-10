"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

type Listener = () => void;

let counter = 0;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function push(payload: Omit<ToastItem, "id">, duration = 4500) {
  const id = ++counter;
  items = [...items, { ...payload, id }];
  emit();
  if (duration > 0) {
    setTimeout(() => {
      items = items.filter((item) => item.id !== id);
      emit();
    }, duration);
  }
  return id;
}

export const toast = {
  success: (title: string, description?: string) =>
    push({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    push({ title, description, variant: "error" }, 7000),
  warning: (title: string, description?: string) => push({ title, description, variant: "warning" }),
  info: (title: string, description?: string) => push({ title, description, variant: "info" }),
  dismiss: (id: number) => {
    items = items.filter((item) => item.id !== id);
    emit();
  },
};

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success" aria-hidden />,
  error: <XCircle className="size-5 text-destructive" aria-hidden />,
  warning: <AlertTriangle className="size-5 text-warning" aria-hidden />,
  info: <Info className="size-5 text-info" aria-hidden />,
};

const accents: Record<ToastVariant, string> = {
  success: "border-l-success",
  error: "border-l-destructive",
  warning: "border-l-warning",
  info: "border-l-info",
};

const EMPTY: ToastItem[] = [];

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Toaster() {
  const current = React.useSyncExternalStore(subscribe, () => items, () => EMPTY);

  if (current.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:items-end sm:p-5"
    >
      {current.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border border-l-4 bg-surface px-4 py-3 shadow-pop",
            accents[item.variant],
          )}
        >
          <div className="mt-0.5 shrink-0">{icons[item.variant]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => toast.dismiss(item.id)}
            className="-m-1 shrink-0 rounded-pill p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
