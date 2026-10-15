import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-semibold">404</p>
      <p className="text-neutral-600">Такой страницы нет — возможно, адрес изменился или профиль скрыт.</p>
      <Link href="/" className="btn">На главную</Link>
    </div>
  );
}
