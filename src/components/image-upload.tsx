"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/app/dashboard/actions";

type Props = {
  name: string;
  defaultPath?: string | null;
  defaultUrl?: string | null;
  shape?: "circle" | "wide";
};

// Отправляет картинку на сервер и кладёт путь к ней в скрытое поле формы.
export function ImageUpload({ name, defaultPath, defaultUrl, shape = "wide" }: Props) {
  const [path, setPath] = useState(defaultPath ?? "");
  const [preview, setPreview] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Файл больше 5 МБ.");

    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadImage(fd).catch(() => ({ error: "Не получилось загрузить файл." }) as const);
    setBusy(false);
    if ("error" in result && result.error) return setError(result.error);
    if ("path" in result && result.path) {
      setPath(result.path);
      setPreview(result.url ?? "");
    }
  }

  function clear() {
    setPath("");
    setPreview("");
  }

  const box = shape === "circle" ? "size-20 rounded-full" : "aspect-[16/9] w-full max-w-xs rounded-xl";

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={path} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`${box} grid shrink-0 place-items-center overflow-hidden border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500 transition hover:border-neutral-500`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : busy ? (
          "Загрузка…"
        ) : (
          "Загрузить"
        )}
      </button>
      <div className="flex flex-col items-start gap-1 text-sm">
        <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Загрузка…" : path ? "Заменить" : "Выбрать файл"}
        </button>
        {path && (
          <button type="button" className="text-neutral-500 hover:underline" onClick={clear}>
            Убрать
          </button>
        )}
        <span className="text-xs text-neutral-400">PNG, JPG, WEBP до 5 МБ</span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
    </div>
  );
}
