"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ShareCard({ username, isPublic }: { username: string; isPublic: boolean }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/${username}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-neutral-500">
          {isPublic ? "Ваша страница для работодателей" : "Страница скрыта — её видите только вы"}
        </p>
        <p className="truncate font-medium">{url.replace(/^https?:\/\//, "")}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" className="btn" onClick={copy}>
          {copied ? "Скопировано ✓" : "Копировать ссылку"}
        </button>
        <Link href={`/${username}`} className="btn-primary">
          Открыть
        </Link>
      </div>
    </div>
  );
}
