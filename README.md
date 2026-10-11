# Car Dealership — Backend

Backend для веб-приложения автосалона. Сервер построен на Node.js и Express, данные подключаются через PostgreSQL.

## Технологии

- Node.js
- Express 5
- PostgreSQL (`pg`)
- JWT для авторизации
- bcrypt для хеширования паролей
- Multer для загрузки файлов
- dotenv для конфигурации окружения
- CORS для взаимодействия с frontend

## Основные компоненты

- `server.js` — сервер Express, middleware, подключение к базе и обработчики API.
- `schema.sql` — схема базы данных.
- `seed.sql` и `seed_images.sql` — SQL-данные для наполнения базы.
- `uploads/` — каталог загружаемых файлов (используется сервером).

## Настройка

Создайте локальный файл `.env` и укажите параметры подключения к PostgreSQL, секрет JWT и адрес frontend. Не публикуйте пароли и секреты в репозитории.

Приложение использует переменные окружения `PORT`, `FRONTEND_URL`, `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` и секрет для JWT.

## Запуск

Требуется установленный Node.js и доступная база PostgreSQL.

```bash
npm install
node server.js
```

По умолчанию сервер использует порт `3000`, если переменная `PORT` не задана.
