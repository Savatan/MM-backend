# Car Dealership — Backend

Backend для веб-приложения автосалона на Node.js и Express с подключением PostgreSQL.

## Технологии

![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169e1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-authentication-000000?logo=jsonwebtokens&logoColor=white)

## Основные компоненты

- `server.js` — Express-сервер, middleware, подключение к базе и обработчики API.
- `schema.sql` — схема базы данных.
- `seed.sql` и `seed_images.sql` — SQL-данные для наполнения базы.
- `uploads/` — каталог загружаемых файлов.

## Реализованные технические решения

- Авторизация с использованием JWT.
- Хеширование паролей через bcrypt.
- Загрузка файлов через Multer.
- Подключение к PostgreSQL через `pg`.
- Настройка окружения через dotenv.
- CORS для взаимодействия с frontend.

## Локальный запуск

Требуются Node.js и доступная база PostgreSQL.

```bash
npm install
node server.js
```

По умолчанию сервер использует порт `3000`, если переменная `PORT` не задана.

## Настройка окружения

Создайте локальный файл `.env` и укажите параметры подключения к PostgreSQL, секрет JWT и адрес frontend.

Используются переменные `PORT`, `FRONTEND_URL`, `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` и секрет для JWT.

Не публикуйте пароли и секреты в репозитории.
