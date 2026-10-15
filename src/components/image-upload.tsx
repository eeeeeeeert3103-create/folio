"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  name: string;
  userId: string;
  defaultValue?: string | null;
  shape?: "circle" | "wide";
};

// Загружает картинку в Supabase Storage и кладёт её адрес в скрытое поле формы.
export function ImageUpload({ name, userId, defaultValue, shape = "wide" }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
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
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    setBusy(false);
    if (error) return setError(error.message);
    setUrl(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
  }

  const box =
    shape === "circle" ? "size-20 rounded-full" : "aspect-[16/9] w-full max-w-xs rounded-xl";

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name={name} value={url} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`${box} grid shrink-0 place-items-center overflow-hidden border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500 transition hover:border-neutral-500`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : busy ? (
          "Загрузка…"
        ) : (
          "Загрузить"
        )}
      </button>
      <div className="flex flex-col items-start gap-1 text-sm">
        <button type="button" className="font-medium underline-offset-2 hover:underline" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Загрузка…" : url ? "Заменить" : "Выбрать файл"}
        </button>
        {url && (
          <button type="button" className="text-neutral-500 hover:underline" onClick={() => setUrl("")}>
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
