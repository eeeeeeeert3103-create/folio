import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-neutral-900 text-sm text-white">F</span>
      Folio
    </Link>
  );
}
