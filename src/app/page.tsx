import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    title: "Одна ссылка вместо пяти",
    text: "Проекты, навыки, учёба и контакты на одной странице folio/ваше-имя. Отправьте её в отклике, в Telegram или вставьте в резюме.",
  },
  {
    title: "PDF за один клик",
    text: "Работодатель просит файл? Скачайте аккуратную PDF-версию портфолио прямо со своей страницы.",
  },
  {
    title: "Проекты, а не просто строчки",
    text: "Обложка, описание по схеме «задача → решение → результат», стек и ссылки на код и демо.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href={user ? "/dashboard" : "/login"} className="btn">
          {user ? "Мой кабинет" : "Войти"}
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="py-20 sm:py-28">
          <p className="chip mb-5">Для студентов и выпускников</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Портфолио, которое не стыдно отправить работодателю
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-600">
            Соберите проекты, навыки и опыт на одной странице за вечер. Делитесь ссылкой или PDF —
            без конструкторов сайтов и вёрстки.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard" : "/login"} className="btn-primary px-6 py-3 text-base">
              Создать портфолио бесплатно
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} Folio
      </footer>
    </div>
  );
}
