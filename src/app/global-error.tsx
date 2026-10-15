"use client";

import "./globals.css";
import { ErrorView } from "@/components/error-view";

// Срабатывает, если сломался даже корневой макет — поэтому свои <html> и <body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body>
        <ErrorView reset={reset} digest={error.digest} />
      </body>
    </html>
  );
}
