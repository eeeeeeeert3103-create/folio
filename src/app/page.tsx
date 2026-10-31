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
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href={user ? "/dashboard" : "/login"} className="btn">
          {user ? "Мой кабинет" : "Войти"}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="landing-hero relative isolate grid items-center gap-12 overflow-hidden rounded-[2rem] border border-violet-100/80 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-14 lg:py-20">
          <div className="hero-glow" aria-hidden="true" />
          <div className="relative z-10">
            <p className="chip mb-6 border border-violet-100 bg-white/80 text-violet-800">Для студентов и выпускников</p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Покажите, <span className="text-violet-700">что умеете</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600">
              Соберите проекты, навыки и опыт в портфолио, которое легко отправить работодателю — одной ссылкой или PDF.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={user ? "/dashboard" : "/login"} className="btn-primary px-6 py-3 text-base shadow-lg shadow-violet-900/15">
                Создать портфолио бесплатно <span aria-hidden="true">↗</span>
              </Link>
              <span className="text-sm text-neutral-500">Без вёрстки и конструктора сайтов</span>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-neutral-600">
              <span><span className="mr-2 text-violet-600">✓</span>Своя ссылка</span>
              <span><span className="mr-2 text-violet-600">✓</span>Экспорт в PDF</span>
              <span><span className="mr-2 text-violet-600">✓</span>Бесплатно</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px] lg:mr-0" role="group" aria-label="Пример страницы портфолио">
            <div className="portfolio-preview relative rounded-3xl border border-white/80 bg-white p-5 shadow-2xl shadow-violet-950/10 sm:p-7">
              <div className="flex flex-col items-start gap-3 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-800">АИ</div>
                  <div><p className="font-semibold">Александр Иванов</p><p className="text-xs text-neutral-500">Продуктовый дизайнер</p></div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Открыт к работе</span>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-violet-700">Избранные проекты</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="preview-tile preview-tile-one"><span>01</span><strong>Навигация<br />по городу</strong></div>
                <div className="preview-tile preview-tile-two"><span>02</span><strong>Финансы<br />понятно</strong></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Figma', 'Исследования', 'Прототипы'].map((skill) => <span key={skill} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">{skill}</span>)}
              </div>
              <div className="mt-5 flex flex-col items-start gap-1 rounded-2xl bg-violet-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-neutral-600">Ссылка для работодателя</span><span className="font-semibold text-violet-800">folio/ivanov ↗</span>
              </div>
            </div>
            <div className="preview-note absolute -bottom-4 -left-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3 text-sm font-medium shadow-xl sm:-left-8">
              <span className="mr-2 text-emerald-600">●</span>Готово к отправке
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mb-8 max-w-xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[.14em] text-violet-700">Всё важное — в одном месте</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">От первого проекта до первого оффера</h2>
          </div>
          <div className="grid gap-4 pb-8 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card feature-card">
              <span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-violet-100 font-semibold text-violet-800" aria-hidden="true">✦</span>
              <h3 className="font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.text}</p>
            </div>
          ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} Folio
      </footer>
    </div>
  );
}
