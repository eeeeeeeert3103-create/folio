# Folio

Платформа, где студенты собирают портфолио и отправляют его работодателю одной ссылкой или PDF.

**Стек:** Next.js 16 · React 19 · Tailwind CSS 4 · Supabase (база данных, вход по почте, хранение картинок)

## Что уже есть

- Главная страница
- Вход по ссылке на почту (без пароля)
- Кабинет: профиль, аватар, навыки, ссылки, проекты с обложками, порядок проектов
- Публичная страница `/имя` — её можно отправить работодателю
- Кнопка «PDF» — аккуратная версия для печати / сохранения в PDF
- Скрытие профиля

## Запуск на своём компьютере

1. Установите [Node.js](https://nodejs.org) (версия LTS).
2. Создайте бесплатный проект на [supabase.com](https://supabase.com).
3. В Supabase откройте **SQL Editor**, вставьте содержимое `supabase/schema.sql` и нажмите **Run**.
4. В Supabase: **Authentication → URL Configuration** → в *Redirect URLs* добавьте `http://localhost:3000/**`.
5. Скопируйте `.env.example` в `.env.local` и вставьте URL и Publishable key из **Project Settings → API Keys**.
6. В терминале в папке проекта:

   ```bash
   npm install
   npm run dev
   ```

7. Откройте http://localhost:3000

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
  lib/                    Supabase-клиенты и типы
  proxy.ts                обновление сессии, защита /dashboard
supabase/schema.sql       таблицы, права доступа, хранилище
```
