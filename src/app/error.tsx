"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/error-view";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Когда связь вернётся — пробуем перерисовать страницу сами.
  useEffect(() => {
    window.addEventListener("online", reset);
    return () => window.removeEventListener("online", reset);
  }, [reset]);

  return <ErrorView reset={reset} digest={error.digest} />;
}
