"use client";

import { useId, useMemo, useState } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange"> & {
  name: string;
  options: readonly string[];
  defaultValue?: string;
  /** Список через запятую: подсказки для последнего пункта, уже выбранные не предлагаются. */
  multiple?: boolean;
};

// Английская раскладка → русская: «vjcrdf» найдёт «Москва».
const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = "йцукенгшщзхъфывапролджэячсмитьбюё";
const toRu = (s: string) => [...s].map((c) => RU[EN.indexOf(c)] ?? c).join("");

const MAX_SHOWN = 8;

function findMatches(query: string, options: readonly string[], exclude: Set<string>) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const variants = [q, toRu(q)];

  const starts: string[] = [];
  const contains: string[] = [];
  for (const option of options) {
    const o = option.toLowerCase();
    if (exclude.has(o) || o === q) continue;
    if (variants.some((v) => o.startsWith(v) || o.split(/[\s(«-]+/).some((word) => word.startsWith(v)))) starts.push(option);
    else if (variants.some((v) => v.length >= 2 && o.includes(v))) contains.push(option);
  }
  return [...starts, ...contains].slice(0, MAX_SHOWN);
}

// Поле ввода с подсказками. Управление: ↑ ↓ — выбор, Enter или Tab — подставить, Esc — закрыть.
export function SuggestInput({ name, options, defaultValue = "", multiple, className, ...rest }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const { query, chosen } = useMemo(() => {
    if (!multiple) return { query: value, chosen: new Set<string>() };
    const parts = value.split(",");
    return {
      query: parts[parts.length - 1],
      chosen: new Set(parts.slice(0, -1).map((p) => p.trim().toLowerCase()).filter(Boolean)),
    };
  }, [value, multiple]);

  const matches = useMemo(() => findMatches(query, options, chosen), [query, options, chosen]);
  const visible = open && matches.length > 0;

  function pick(option: string) {
    if (multiple) {
      const parts = value.split(",").slice(0, -1).map((p) => p.trim()).filter(Boolean);
      setValue([...parts, option].join(", ") + ", ");
    } else {
      setValue(option);
      setOpen(false);
    }
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter" || (e.key === "Tab" && query.trim())) {
      e.preventDefault(); // Enter не отправляет форму, пока открыт список
      pick(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        {...rest}
        name={name}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible ? `${listId}-${active}` : undefined}
        className={className ?? "input"}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {visible && (
        <ul
          id={listId}
          role="listbox"
          className="anim-fade-up absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg [animation-duration:150ms]"
        >
          {matches.map((option, i) => (
            <li
              key={option}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, а не click: иначе поле потеряет фокус и список закроется раньше
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${i === active ? "bg-neutral-100" : ""}`}
            >
              <Highlight text={option} query={query.trim()} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Выделяет совпавшую часть жирным.
function Highlight({ text, query }: { text: string; query: string }) {
  const lower = text.toLowerCase();
  const q = [query.toLowerCase(), toRu(query.toLowerCase())].find((v) => v && lower.includes(v));
  if (!q) return <>{text}</>;
  const i = lower.indexOf(q);
  return (
    <>
      {text.slice(0, i)}
      <b className="font-semibold">{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  );
}
