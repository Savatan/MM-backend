# Car Dealership — Backend

Backend часть веб-приложения автосалона. Предоставляет серверную логику и взаимодействие с базой данных для frontend-приложения.

## Возможности

- HTTP API на Express.
- Подключение к PostgreSQL.
- Аутентификация с использованием JWT.
- Хеширование паролей с bcrypt.
- Загрузка и раздача пользовательских файлов.
- Настройка CORS для взаимодействия с frontend.

## Технологии

Node.js · Express · PostgreSQL · pg · JWT · bcrypt · Multer · dotenv

## Требования

- Node.js и npm.
- Запущенный экземпляр PostgreSQL.
- Переменные окружения для подключения к базе данных и настройки сервера.

## Локальный запуск

```bash
git clone https://github.com/Savatan/MM-backend.git
cd MM-backend
npm install
```

Создайте файл `.env` и задайте параметры подключения к базе данных. Сервер использует следующие переменные:

```dotenv
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
```

Значения выше — пример формата конфигурации; замените их параметрами своей среды. После подготовки базы данных запустите сервер:

```bash
npm start
```

Frontend Vite настроен на обращение к API через локальный адрес backend на порту 3000. Схему базы данных и необходимые начальные данные нужно подготовить согласно коду проекта.
