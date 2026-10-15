import Link from "next/link";
import { LostScene } from "@/components/status-scene";
import { StatusPage } from "@/components/status-page";

export default function NotFound() {
  return (
    <StatusPage
      scene={<LostScene />}
      code="ОШИБКА 404"
      title="Страница потерялась"
      text="Ищем-ищем, но не находим. Возможно, адрес изменился, профиль скрыт или в ссылке опечатка."
    >
      <Link href="/" className="btn-primary">
        На главную
      </Link>
      <Link href="/dashboard" className="btn">
        Мой кабинет
      </Link>
    </StatusPage>
  );
}
