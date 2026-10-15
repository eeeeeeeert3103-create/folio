"use client";

import Link from "next/link";
import { useState } from "react";
import { copyText } from "@/lib/copy";

export function ShareBar({ isOwner, isPublic }: { isOwner: boolean; isPublic: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;
    // На телефоне — системное меню «Поделиться» (Telegram, почта и т. д.), на компьютере — копирование.
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title: document.title, url }).catch(() => {});
      return;
    }
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">Folio</Link>
        <div className="flex gap-2">
          {isOwner && (
            <Link href="/dashboard" className="btn">
              Редактировать
            </Link>
          )}
          <button className="btn" onClick={() => window.print()}>
            PDF
          </button>
          <button className="btn-primary" onClick={copy}>
            {copied ? "Скопировано ✓" : "Поделиться"}
          </button>
        </div>
      </div>
      {isOwner && !isPublic && (
        <p className="bg-amber-50 py-2 text-center text-sm text-amber-800">
          Страница скрыта: по ссылке её видите только вы.
        </p>
      )}
    </div>
  );
}
