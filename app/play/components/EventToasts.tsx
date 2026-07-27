"use client";

import { useEffect } from "react";

export interface Toast {
  id: string;
  message: string;
}

const AUTO_DISMISS_MS = 4000;

export function EventToasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="animate-fadein pointer-events-auto rounded-full bg-[#1c2b24] px-5 py-2 text-sm text-[#f3e8d4] shadow-lg">
      {toast.message}
    </div>
  );
}
