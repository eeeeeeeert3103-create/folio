"use client";

import Link from "next/link";
import { useState } from "react";
import { copyText } from "@/lib/copy";

type Props = { siteUrl: string; username: string; isPublic: boolean };

export function ShareCard({ siteUrl, username, isPublic }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const url = `${siteUrl}/${username}`;
  // Пока сайт не опубликован, ссылка ведёт на этот компьютер и у других не откроется.
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(siteUrl);

  async function copy() {
    setStatus((await copyText(url)) ? "copied" : "failed");
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">
            {isPublic ? "Ваша страница для работодателей" : "Страница скрыта — её видите только вы"}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-medium underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            {url.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn" onClick={copy}>
            {status === "copied" ? "Скопировано ✓" : status === "failed" ? "Не удалось" : "Копировать ссылку"}
          </button>
          <Link href={`/${username}`} className="btn-primary">
            Открыть
          </Link>
        </div>
      </div>
      {isLocal && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Сайт пока работает только на этом компьютере, поэтому у других людей ссылка не откроется. После
          публикации в интернете здесь появится постоянный адрес, которым можно делиться.
        </p>
      )}
    </div>
  );
}
