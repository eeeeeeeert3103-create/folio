# Folio

[Русский](README.md) · [English](README.en.md)

[![Демо](https://img.shields.io/badge/демо-folio--mu--jet.vercel.app-000?logo=vercel)](https://folio-mu-jet.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=fff)

Платформа, где студенты собирают портфолио и отправляют его работодателю одной ссылкой или PDF.

![Главная страница Folio](docs/screenshot-home.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Feeeeeeeert3103-create%2Ffolio&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&envDescription=Supabase%20Project%20Settings%20%E2%86%92%20API%20Keys)

Перед деплоем создайте проект в Supabase и примените миграции (шаги 2–4 ниже).

**Сайт:** https://folio-mu-jet.vercel.app

**Стек:** Next.js 16 · React 19 · Tailwind CSS 4 · Zod · Supabase (база данных, вход по почте, хранение картинок)

## Что уже есть

- Главная страница
- Вход по ссылке на почту (без пароля)
- Кабинет: профиль, аватар, навыки, ссылки, проекты с обложками, порядок проектов
- Публичная страница `/имя` — её можно отправить работодателю
- Кнопка «PDF» — аккуратная версия для печати / сохранения в PDF
- Профиль закрыт по умолчанию; публикация включается отдельно в кабинете

## Запуск на своём компьютере

1. Установите [Node.js](https://nodejs.org) (версия LTS).
2. Создайте бесплатный проект на [supabase.com](https://supabase.com).
3. В Supabase откройте **SQL Editor**, вставьте содержимое `supabase/migrations/` и нажмите **Run**.
4. В Supabase: **Authentication → URL Configuration** → в *Redirect URLs* добавьте `http://localhost:3000/**`.
5. Скопируйте `.env.example` в `.env.local` и вставьте URL и Publishable key из **Project Settings → API Keys**.
   Для постоянного домена задайте `FOLIO_SITE_URL` в `.env.local` и переменных окружения Vercel.
6. В терминале в папке проекта:

   ```bash
   npm install
   npm run dev
   ```

7. Откройте http://localhost:3000

## Публикация

```bash
npx vercel@latest deploy --prod
```

## Структура

```
src/
  app/
    page.tsx              главная
    login/                вход
    auth/                 обработка ссылки из письма, выход
    dashboard/            кабинет студента (+ actions.ts — сохранение данных)
    [username]/           публичная страница портфолио
  components/             общие компоненты
  lib/                    Supabase-клиент (только серверный), картинки, типы
  proxy.ts                сессия, защита /dashboard, Content-Security-Policy
supabase/migrations/      таблицы, права доступа, хранилище, лимиты
```

## Безопасность

- Сессия в `httpOnly`-куках; браузер не обращается к Supabase напрямую — всё через сервер.
- Content-Security-Policy с nonce на каждый запрос, без `unsafe-inline` для скриптов.
- Все права проверяет база (RLS): чужие данные нельзя прочитать или изменить даже в обход сайта.
- Картинки в приватном бакете, выдаются по временным ссылкам и только если показаны на публичной странице.
- Ввод проверяется Zod-схемами на сервере и ограничениями в базе; лимит частоты действий на пользователя.

## Проверки

```bash
npm run lint
npm run typecheck
npx supabase db advisors --linked
```

## Лицензия

[MIT](LICENSE)
