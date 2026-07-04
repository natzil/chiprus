# RPG Dashboard

Mobile-first личная RPG-система в тёмном terminal стиле. Главная логика теперь такая: сайт всегда работает из `localStorage`, а Supabase используется только как фоновая синхронизация. Если сеть или backend упали, интерфейс не ломается.

## Что внутри

- `index.html` — оболочка приложения и модальное окно добавления квеста.
- `css/style.css` — текущий RPG/terminal visual language плюс мобильные фиксы.
- `js/state.js` — стартовая структура данных: branches, tracks, quests, logs, reviews, queue.
- `js/render.js` и `js/views-*.js` — pseudo-pages без роутера: overview, branches, branch, track, quest detail, log, settings.
- `js/reducers.js` — действия: start, save, checklist, complete, review later, add, undo.
- `js/storage.js` — локальный snapshot.
- `js/queue.js` и `js/sync.js` — offline queue и фоновый Supabase sync.
- `supabase/schema.sql` — таблицы.
- `supabase/rls.sql` — RLS по `owner_id = auth.uid()`.
- `supabase/seed.sql` — стартовые ветки, CCNA 1-63 и базовые задачи.

## Экраны

- `overview` — уровень, XP, крупные бары, следующий ход, быстрые действия.
- `branches` — 4 ветки: Обучение, Проекты, Здоровье, Работа / развитие.
- `branch-detail` — треки и активные задачи выбранной ветки.
- `track-detail` — глубокий список задач, например CCNA Day 1-63.
- `quest-detail` — цель, теория, практика, checklist, заметка, результат, кнопка done.
- `log` — история выполненного, sync status, undo.
- `settings` — sync/reset.

## Supabase setup

1. Создай Supabase project.
2. В Auth включи `Allow anonymous sign-ins`.
3. В SQL Editor выполни по порядку:
   - `supabase/schema.sql`
   - `supabase/rls.sql`
   - `supabase/seed.sql`
4. Скопируй `js/config.example.js` в `js/config.js`.
5. Заполни:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_ENABLED: true`

Важно: в браузер кладём только publishable key. Service role key сюда нельзя.

## Как работает sync

- При открытии сайта создаётся anonymous session.
- Все действия сразу сохраняются локально.
- Операции попадают в очередь.
- Sync пробует отправить очередь в Supabase.
- Если Supabase не отвечает, сайт остаётся рабочим, а очередь ждёт следующей попытки.
- `Undo` откатывает последнее локальное действие и тоже ставит операцию в очередь.

## Данные по умолчанию

Обучение:
- CCNA: 63 урока Jeremy's IT Lab.
- English: короткие daily practice задачи.
- Linux: базовые повторения и later tasks.

Проекты:
- NAS-сервер.
- ESP32 + RFID замок.
- Arduino бар / mini project.
- Чиптюнинг развитие.

Здоровье:
- Бассейн 2-3 раза в неделю в 6:30.
- Базовая рутина.
- Ходьба / активность.

Работа / развитие:
- NOC/DevOps путь.
- Резюме.
- Linux/network practice.
- Собеседования.

## Публикация

Это статический сайт. Можно положить на GitHub Pages или обычный hosting. Для GitHub Pages достаточно обновить `index.html`, `css/`, `js/`, `supabase/` и `CNAME`, если нужен домен.
