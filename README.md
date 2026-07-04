# RPG Dashboard

Local-first личная RPG-система в одном статическом сайте.

## Архитектура

- `overview` — мотивационный первый экран: level, XP, крупные бары, следующий ход.
- `branches` — 4 основные ветки:
  - Обучение
  - Проекты
  - Здоровье / рутина
  - Работа / развитие
- `branch` — задачи и треки внутри выбранной ветки.
- `track` — глубокий список задач конкретного направления, например CCNA Day 1-63.
- `log` — история выполненного, sync status и undo.

## Хранение данных

Главный источник данных — `localStorage` браузера.

Google Sheets не обязателен. Если Apps Script недоступен, сайт продолжает работать локально:

- задачи выполняются;
- XP начисляется;
- выполненные задачи уходят из следующего хода;
- история остаётся в логе;
- `Undo` отменяет последнее действие.

## Файлы

- `index.html` — app shell и модальные окна.
- `css/style.css` — текущий terminal/RPG visual language плюс новые view-компоненты.
- `js/state.js` — понятная структура данных: branches, tracks, tasks, log, undoStack, sync.
- `js/api.js` — localStorage + фоновой Google Sheets sync.
- `js/render.js` — рендер overview / branches / branch / track / log.
- `js/app.js` — клики, навигация, done/status/undo/sync.
- `google-apps-script/Code.gs` — опциональный Google Sheets sync backend.

## Google Sheets sync

1. Создай Google Sheet.
2. Открой Apps Script.
3. Вставь `google-apps-script/Code.gs`.
4. Запусти `setup()`.
5. Deploy → Web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Вставь `/exec` URL в `js/config.js`.

Sync идёт в фоне. Ошибки не блокируют интерфейс.

## Основные данные по умолчанию

Обучение:
- CCNA: 63 урока Jeremy's IT Lab
- English daily practice
- Linux базовые повторения

Проекты:
- NAS-сервер
- ESP32 + RFID замок
- Arduino бар
- Чиптюнинг развитие

Здоровье:
- Бассейн 6:30
- Базовая рутина
- Ходьба / активность

Работа / развитие:
- NOC/DevOps путь
- Резюме
- Linux/network practice
- Собеседования
