<div align="center">

[🇷🇺 Русский] | [🇺🇸 English](README_EN.md)

<a href="https://fbads.fun"><img src="docs/screenshots/accounts.svg" alt="ParserAccs" width="100%" style="border-radius: 8px;"></a>

# ParserAccs

**Одна закладка для массовой работы с Facebook Ads Manager**

Сводка по кабинетам · CSV · AutoRules · CloneAds

[![Website](https://img.shields.io/badge/Website-fbads.fun-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://fbads.fun)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Language](https://img.shields.io/badge/Language-JavaScript-yellow?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

ParserAccs запускается прямо в Ads Manager и собирает рабочие инструменты в одном окне — без расширений, установки и серверов.

| Модуль | Что делает | Доступ |
|---|---|---|
| **📊 Кабинеты** | Балансы, траты, лимиты, биллинг, статусы, объявления и Business Manager | Только чтение |
| **⚙️ AutoRules** | Экспорт, перенос и массовое управление автоправилами | Запись после подтверждения |
| **🧬 CloneAds** | Клонирование кампаний, адсетов, объявлений и креативов между кабинетами | **Beta**, запись после подтверждения |

> [!IMPORTANT]
> ParserAccs не является продуктом Meta и не связан с Facebook. Перед массовыми изменениями проверяйте выбранные кабинеты и параметры операции.

## ⚡ Установка за минуту

1. Откройте **[fbads.fun](https://fbads.fun)**.
2. Покажите панель закладок: `Ctrl + Shift + B` (на macOS — `⌘ + Shift + B`).
3. Выберите язык **RU / EN**.
4. Перетащите кнопку **📌 ParserAccs** на панель закладок.
5. Откройте Facebook Ads Manager и нажмите закладку.

Не получается перетащить? Нажмите **«Скопировать код»**, создайте обычную закладку и вставьте код в поле URL.

> [!TIP]
> Закладка обновляется сама — после новых релизов переустанавливать её не нужно.

## ✨ Возможности

### 📊 Кабинеты

- общая таблица всех доступных рекламных кабинетов;
- ID без приставки `act_`, **Copy IDs** и выгрузка в CSV для Excel;
- имя, статус, валюта, баланс и дневной лимит;
- траты за всё время и за выбранный период: Today, Yesterday, 7/14/30 дней, месяцы, Lifetime и свои даты;
- порог биллинга и привязанный Business Manager;
- активные и отклонённые объявления;
- поиск, фильтры и сортировка по нескольким колонкам;
- выделение сохраняется при фильтрации и сортировке;
- обновление данных без закрытия окна.

При смене периода траты пересчитываются прямо поверх таблицы:

<a href="https://fbads.fun/docs/screenshots/recount.svg"><img src="docs/screenshots/recount.svg" alt="Пересчёт трат" width="820" style="border-radius: 8px;"></a>

### ⚙️ AutoRules

Переносит автоматические правила из кабинета-донора в выбранные кабинеты.

- выбор отдельных правил и импорт сразу в несколько кабинетов;
- фильтры и счётчики правил по кабинетам;
- пересчёт денежных порогов под валюту целевого кабинета;
- импорт в состоянии `PAUSED`;
- массовое включение, выключение и удаление;
- экспорт и импорт правил через JSON;
- подробный цветной лог операций.

> [!NOTE]
> Время в правилах `SCHEDULED` не сдвигается автоматически из‑за перехода на летнее время. Разница часовых поясов выводится в лог для ручной проверки.

<a href="https://fbads.fun/docs/screenshots/autorules.svg"><img src="docs/screenshots/autorules.svg" alt="ParserAccs AutoRules" width="820" style="border-radius: 8px;"></a>

### 🧬 CloneAds — beta

Клонирует выбранные кампании из кабинета-донора в один или несколько целевых кабинетов.

- кампании, адсеты, объявления и креативы;
- экспорт и импорт структуры через JSON;
- подстановка Fan Page, пикселя и Instagram;
- перенос изображений и мультиязычных ассетов (где позволяет API);
- статус кампании `PAUSED` или `ACTIVE`, безопасный режим «черновик»;
- замена Fan Page и случайный бюджет в заданном диапазоне;
- нейминг: исходный, замена ID, Find/Replace или шаблоны с макросами;
- кнопка «Стоп», лог ошибок и защита от повторной обработки.

> [!WARNING]
> Оставляйте кампании на `PAUSED`, используйте черновик и проверяйте результат в Ads Manager перед запуском. CloneAds — экспериментальный модуль: некоторые форматы могут потребовать ручной доработки.

<a href="https://fbads.fun/docs/screenshots/cloneads.svg"><img src="docs/screenshots/cloneads.svg" alt="ParserAccs CloneAds" width="820" style="border-radius: 8px;"></a>

## 🔐 Безопасность

- Вкладка **Кабинеты** только читает данные.
- AutoRules и CloneAds спрашивают подтверждение перед любыми изменениями.
- Токен берётся из открытой сессии Ads Manager и **никуда не отправляется** — только в официальный Graph API от вашего имени.
- Код открыт, каждая версия проверяется по контрольной сумме.

## 🌐 Языки

Русский и английский. Язык выбирается на лендинге, а внутри ParserAccs переключается без перезапуска.

<details>
<summary>🛠 Техническая архитектура и Разработка (Кликни, чтобы раскрыть)</summary>

### Как устроена доставка

```text
src/*.js
   ↓ npm run build
parseraccs.js
   ↓ упаковка + SHA-256
manifest + Open Graph chunk
   ↓ Cloudflare Workers / fbads.fun
стабильный загрузчик в закладке
```

В закладке хранится небольшой загрузчик, а не вся программа. При запуске он:

1. получает опубликованную версию ParserAccs (manifest + chunk через Open Graph-кэш Facebook);
2. проверяет SHA-256 содержимого;
3. сохраняет рабочую копию в `localStorage`;
4. использует кэш, если свежая версия временно недоступна.

### Сборка

Нужен Node.js 20+.

```bash
git clone https://github.com/KwentyInc/ParserAccs.git
cd ParserAccs
npm ci
npm run check
npm run build
```

| Команда | Что делает |
|---|---|
| `npm run build:payload` | собирает `parseraccs.js` из `src/` |
| `npm run check` | проверяет актуальность и синтаксис сборки |
| `npm run build` | создаёт готовый каталог `dist/` |

### Деплой

Cloudflare Workers собирает и публикует лендинг и пакет после каждого push в `main`. После деплоя `scripts/fb-rescrape.cjs` сам обновляет кэш Facebook. Вручную это можно сделать через [Sharing Debugger](https://developers.facebook.com/tools/debug/) для адресов:

```text
https://fbads.fun/parseraccs/latest/manifest
https://fbads.fun/parseraccs/latest/og/chunk-001
```

Подробнее — в [HOSTING.md](HOSTING.md).

### Структура исходников

```text
src/i18n.js       токен, переводы и общие данные
src/accounts.js   загрузка кабинетов и метрик
src/modal.js      каркас интерфейса
src/rules.js      AutoRules
src/clone*.js     CloneAds
src/styles.js     дизайн интерфейса
src/bindings.js   события, таблица и экспорт
```

</details>

## ☕ Поддержать проект

> 💚 **ParserAccs бесплатный, с открытым кодом и без рекламы.**
> Если инструмент экономит вам время — можно угостить автора кофе ☕
>
> 🟥 **USDT TRC-20 (Tron):** `TVGbahTRp8QjrU4pHxrop7VNdQ5xhoTngZ`
>
> 🔷 **USDT ERC-20 (Ethereum):** `0x3A0a4287A488C6C8BCFBc8e8acD1409b8ffE48E0`
>
> 📱 QR-коды — в разделе [«Донат» на fbads.fun](https://fbads.fun/#donate). Спасибо! 🙏

## 📄 Лицензия

[MIT](LICENSE) · Автор: [Kwenty](https://t.me/kw33nty)
