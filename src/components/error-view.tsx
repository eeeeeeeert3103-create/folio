"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BrokenScene, OfflineScene } from "./status-scene";
import { StatusPage } from "./status-page";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// Есть ли интернет — следим за событиями браузера.
function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

// Экран «что-то пошло не так». Без интернета показывает отдельную сцену.
export function ErrorView({ reset, digest }: { reset: () => void; digest?: string }) {
  const online = useOnline();

  return online ? (
    <StatusPage
      scene={<BrokenScene />}
      code="ОШИБКА"
      title="Что-то пошло не так"
      text="Попробуйте ещё раз — обычно это помогает. Если не выйдет, загляните чуть позже."
    >
      <button className="btn-primary" onClick={reset}>
        Попробовать снова
      </button>
      <Link href="/" className="btn">
        На главную
      </Link>
      {digest && <p className="w-full text-xs text-neutral-400">Код ошибки: {digest}</p>}
    </StatusPage>
  ) : (
    <StatusPage
      scene={<OfflineScene />}
      code="НЕТ СЕТИ"
      title="Пропал интернет"
      text="Проверьте Wi-Fi или мобильную сеть. Страница обновится, как только связь вернётся."
    >
      <button className="btn-primary" onClick={reset}>
        Обновить
      </button>
    </StatusPage>
  );
}
