"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  timeout?: number; // ms
}

interface ToastContextValue {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, timeout: 4000, ...t };
      setToasts((prev) => [...prev, toast]);
      if (toast.timeout && toast.timeout > 0) {
        setTimeout(() => dismiss(id), toast.timeout);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2 w-72">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border rounded shadow px-3 py-2 text-sm flex items-start gap-2 animate-fade-in bg-white ${
              t.type === "success"
                ? "border-emerald-400"
                : t.type === "error"
                  ? "border-red-400"
                  : "border-gray-300"
            }`}
          >
            <div className="flex-1">
              <span
                className={`font-medium ${
                  t.type === "success"
                    ? "text-emerald-700"
                    : t.type === "error"
                      ? "text-red-700"
                      : "text-gray-700"
                }`}
              >
                {t.message}
              </span>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
