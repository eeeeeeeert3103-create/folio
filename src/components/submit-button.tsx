"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText = "Сохраняем…" }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
