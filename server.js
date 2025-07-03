// server.js

// Загружаем переменные окружения из файла .env
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// --- НОВОЕ: Добавляем multer для загрузки файлов ---
const multer = require('multer');
// --- КОНЕЦ НОВОГО ---

const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// --- ДИАГНОСТИЧЕСКИЙ MIDDLEWARE ---
// Этот middleware логирует каждый входящий запрос для отладки.
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
  next();
});
// --- КОНЕЦ ДИАГНОСТИЧЕСКОГО MIDDLEWARE ---

// --- ОБСЛУЖИВАНИЕ СТАТИЧЕСКИХ ФАЙЛОВ (ИЗОБРАЖЕНИЙ) ---
// ЭТА СТРОКА КРИТИЧЕСКИ ВАЖНА для отображения изображений!
// Она позволяет браузеру запрашивать файлы из папки 'uploads'
// по URL-адресу, начинающемуся с '/uploads'.
// ОЧЕНЬ ВАЖНО: ЭТОТ MIDDLEWARE ДОЛЖЕН ИДТИ ПЕРЕД ДРУГИМИ МАРШРУТАМИ,
// КОТОРЫЕ МОГУТ ПЕРЕХВАТИТЬ ЗАПРОСЫ К СТАТИЧЕСКИМ ФАЙЛАМ.
app.use('/uploads', express.static('uploads'));
// --- КОНЕЦ ОБСЛУЖИВАНИЯ СТАТИЧЕСКИХ ФАЙЛОВ ---

// --- НОВОЕ: Настройка Multer для загрузки файлов ---
// Определяем хранилище для Multer. Здесь файлы будут сохраняться на диск.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Убедитесь, что папка 'uploads/' существует в корне вашего проекта
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла, чтобы избежать коллизий
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// Создаем экземпляр Multer с настроенным хранилищем
const upload = multer({ storage: storage });
// --- КОНЕЦ НОВОГО ---


// --- Подключение к базе данных PostgreSQL ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Проверка соединения с базой данных
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client to PostgreSQL database:', err.stack);
    return;
  }
  console.log('Connected to PostgreSQL database successfully!');
  release();
});

// --- Вспомогательные функции (Helpers) ---

/**
 * Хэширует переданный пароль с использованием bcrypt.
 * @param {string} password - Пароль для хэширования.
 * @returns {Promise<string>} Хэшированный пароль.
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Сравнивает переданный пароль с хэшированным паролем.
 * @param {string} password - Пароль для сравнения.
 * @param {string} hashedPassword - Хэшированный пароль из базы данных.
 * @returns {Promise<boolean>} True, если пароли совпадают, иначе False.
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Middleware для аутентификации пользователя по JWT токену.
 * Устанавливает `req.user` если токен действителен.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Требуется токен аутентификации.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      // Возвращаем 403, если токен недействителен (например, просрочен или изменен)
      return res.status(403).json({ message: 'Неверный или просроченный токен.' });
    }
    req.user = user; // Сохраняем информацию о пользователе в объекте запроса
    next();
  });
};

/**
 * Middleware для авторизации администраторов.
 * Должен использоваться после `authenticateToken`.
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Доступ запрещен: требуются права администратора.' });
  }
  next();
};

// --- Маршруты (Routes) ---

// Базовый маршрут для проверки работы API
app.get('/', (req, res) => {
  res.send('Welcome to the Car Dealership Backend API!');
});

// --- Аутентификация и Авторизация ---

// Маршрут для регистрации нового пользователя
app.post('/api/auth/register', async (req, res) => {
  console.log('[DEBUG] Reached /api/auth/register route handler.');
  const { email, password, name, phone } = req.body;

  const phoneRegex = /^\+7\d{10}$/; // Простая валидация номера телефона

  if (!email || !password || !name || !phone) {
    return res.status(400).json({ message: 'Email, пароль, имя и телефон обязательны.' });
  }

  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, phone, is_admin',
      [email, hashedPassword, name, phone]
    );

    const user = result.rows[0];
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован!', user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });

  } catch (error) {
    if (error.code === '23505') { // Код ошибки для нарушения уникальности (duplicate key)
      return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ошибка сервера во время регистрации.' });
  }
});

// Маршрут для входа пользователя
app.post('/api/auth/login', async (req, res) => {
  console.log('[DEBUG] Reached /api/auth/login route handler.');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Неверные учетные данные.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные.' });
    }

    // Генерируем JWT токен с ID пользователя, email и статусом администратора
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Токен истекает через 1 час
    );

    res.json({
      message: 'Вход выполнен успешно!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        is_admin: user.is_admin,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера во время входа.' });
  }
});

// Маршрут для получения профиля текущего пользователя
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/user/profile route handler.');
  try {
    const result = await pool.query('SELECT id, email, name, phone, is_admin, created_at FROM users WHERE id = $1', [req.user.id]);
    const userProfile = result.rows[0];

    if (!userProfile) {
      return res.status(404).json({ message: 'Профиль пользователя не найден.' });
    }
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля пользователя.' });
  }
});

// Маршрут для обновления профиля текущего пользователя
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/user/profile PUT route handler.');
  const userId = req.user.id;
  const { name, email, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Имя и Email обязательны для обновления профиля.' });
  }

  const phoneRegex = /^\+7\d{10}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET
        name = $1,
        email = $2,
        phone = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, name, phone, is_admin, created_at`,
      [name, email, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' });
    }
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля.' });
  }
});

// Маршрут для удаления профиля текущего пользователя
app.delete('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/user/profile DELETE route handler.');
  const userId = req.user.id; // ID пользователя из токена

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    res.json({ message: 'Профиль успешно удален!' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении профиля.' });
  }
});


// --- Маршруты для работы с автомобилями (доступны всем) ---

// Маршрут для получения всех автомобилей с главной фотографией (thumbnail)
app.get('/api/cars', async (req, res) => {
  console.log('[DEBUG] Reached /api/cars GET route handler');
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        (SELECT cp.url FROM car_photos cp WHERE cp.car_id = c.id AND cp.is_main = TRUE LIMIT 1) AS thumbnail_url
      FROM
        cars c
      ORDER BY
        c.id ASC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка автомобилей.' });
  }
});

// Маршрут для получения информации об одном автомобиле по ID
app.get('/api/cars/:id', async (req, res) => {
  console.log('[DEBUG] Reached /api/cars/:id route handler.');
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching car with ID ${id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении автомобиля.' });
  }
});

// Маршрут для получения фотографий конкретного автомобиля
app.get('/api/cars/:id/photos', async (req, res) => {
  console.log(`[DEBUG] Reached /api/cars/:id/photos GET route handler for car ID: ${req.params.id}`);
  const carId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT id, car_id, url AS image_url, is_main, order_index FROM car_photos WHERE car_id = $1 ORDER BY order_index ASC',
      [carId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching photos for car ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении фотографий автомобиля.' });
  }
});


// --- Маршруты для админ-панели (требуют аутентификации и прав администратора) ---

// Маршрут для добавления нового автомобиля
app.post('/api/admin/cars', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/cars POST route handler.');
  const {
    make, model, engine_type, horsepower, acceleration_0_100, range,
    drive_type, color, year, engine_volume, body_type, transmission,
    mileage, price, description, stock_quantity
  } = req.body;

  if (!make || !model || !year || !price) {
    return res.status(400).json({ message: 'Марка, модель, год и цена обязательны для автомобиля.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cars (
        make, model, engine_type, horsepower, acceleration_0_100, range,
        drive_type, color, year, engine_volume, body_type, transmission,
        mileage, price, description, stock_quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        make, model, engine_type, horsepower, acceleration_0_100, range,
        drive_type, color, year, engine_volume, body_type, transmission,
        mileage, price, description, stock_quantity
      ]
    );
    res.status(201).json({ message: 'Автомобиль успешно добавлен!', car: result.rows[0] });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении автомобиля.' });
  }
});

// Маршрут для обновления данных автомобиля
app.put('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/cars PUT route handler.');
  const { id } = req.params;
  const {
    make, model, engine_type, horsepower, acceleration_0_100, range,
    drive_type, color, year, engine_volume, body_type, transmission,
    mileage, price, description, stock_quantity
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cars SET
        make = COALESCE($1, make),
        model = COALESCE($2, model),
        engine_type = COALESCE($3, engine_type),
        horsepower = COALESCE($4, horsepower),
        acceleration_0_100 = COALESCE($5, acceleration_0_100),
        range = COALESCE($6, range),
        drive_type = COALESCE($7, drive_type),
        color = COALESCE($8, color),
        year = COALESCE($9, year),
        engine_volume = COALESCE($10, engine_volume),
        body_type = COALESCE($11, body_type),
        transmission = COALESCE($12, transmission),
        mileage = COALESCE($13, mileage),
        price = COALESCE($14, price),
        description = COALESCE($15, description),
        stock_quantity = COALESCE($16, stock_quantity),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *`,
      [
        make, model, engine_type, horsepower, acceleration_0_100, range,
        drive_type, color, year, engine_volume, body_type, transmission,
        mileage, price, description, stock_quantity, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }
    res.json({ message: 'Автомобиль успешно обновлен!', car: result.rows[0] });
  } catch (error) {
    console.error(`Error updating car with ID ${id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении автомобиля.' });
  }
});

// Маршрут для удаления автомобиля
app.delete('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/cars DELETE route handler.');
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }
    res.json({ message: 'Автомобиль успешно удален!', id: result.rows[0].id });
  } catch (error) {
    console.error(`Error deleting car with ID ${id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении автомобиля.' });
  }
});



// POST /api/admin/cars/:carId/photos - Загрузка фотографий для автомобиля
// Используем 'upload.array('photos', 10)' для загрузки нескольких файлов (до 10)
app.post('/api/admin/cars/:carId/photos', authenticateToken, authorizeAdmin, upload.array('photos', 10), async (req, res) => {
  console.log(`[DEBUG] Reached /api/admin/cars/:carId/photos POST route handler for car ID: ${req.params.carId}`);
  const carId = req.params.carId;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Файлы для загрузки отсутствуют.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Начать транзакцию

    // Проверяем существование автомобиля
    const carCheck = await client.query('SELECT id FROM cars WHERE id = $1', [carId]);
    if (carCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }

    const uploadedPhotos = [];
    for (const file of req.files) {
      // URL будет формироваться на основе того, как вы настроили express.static
      const imageUrl = `/uploads/${file.filename}`;

      // Добавляем запись в таблицу car_photos
      const result = await client.query(
        'INSERT INTO car_photos (car_id, url) VALUES ($1, $2) RETURNING id, car_id, url, is_main, order_index',
        [carId, imageUrl]
      );
      uploadedPhotos.push(result.rows[0]);
    }

    await client.query('COMMIT'); // Завершить транзакцию
    res.status(201).json({ message: 'Фотографии успешно загружены!', photos: uploadedPhotos });

  } catch (error) {
    await client.query('ROLLBACK'); // Откатить транзакцию в случае ошибки
    console.error(`Error uploading photos for car ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при загрузке фотографий.' });
  } finally {
    client.release();
  }
});

// PUT /api/admin/photos/:photoId/set-main - Установить фотографию как главную
app.put('/api/admin/photos/:photoId/set-main', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log(`[DEBUG] Reached /api/admin/photos/:photoId/set-main PUT route handler for photo ID: ${req.params.photoId}`);
  const photoId = req.params.photoId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Получаем car_id для данной фотографии
    const photoResult = await client.query('SELECT car_id FROM car_photos WHERE id = $1', [photoId]);
    if (photoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Фотография не найдена.' });
    }
    const carId = photoResult.rows[0].car_id;

    // Сначала устанавливаем is_main = FALSE для всех фотографий этого автомобиля
    await client.query('UPDATE car_photos SET is_main = FALSE WHERE car_id = $1', [carId]);

    // Затем устанавливаем is_main = TRUE для выбранной фотографии
    const updateResult = await client.query(
      'UPDATE car_photos SET is_main = TRUE WHERE id = $1 RETURNING id, car_id, url, is_main',
      [photoId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Главная фотография успешно установлена!', photo: updateResult.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error setting main photo for photo ID ${photoId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при установке главной фотографии.' });
  } finally {
    client.release();
  }
});

// DELETE /api/admin/photos/:photoId - Удаление фотографии
// НОВОЕ: ВАЖНО: При удалении фотографии с диска используйте 'fs.unlink'
const fs = require('fs'); // Подключаем модуль fs для работы с файловой системой
const path = require('path'); // Подключаем модуль path для работы с путями файлов

app.delete('/api/admin/photos/:photoId', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log(`[DEBUG] Reached /api/admin/photos/:photoId DELETE route handler for photo ID: ${req.params.photoId}`);
  const photoId = req.params.photoId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Получаем URL файла для удаления с диска
    const photoResult = await client.query('SELECT url FROM car_photos WHERE id = $1', [photoId]);
    if (photoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Фотография не найдена.' });
    }
    const photoUrl = photoResult.rows[0].url;

    // Удаляем запись из базы данных
    const deleteResult = await client.query('DELETE FROM car_photos WHERE id = $1 RETURNING id', [photoId]);

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Фотография не найдена или уже удалена.' });
    }

    // Удаляем файл с диска
    const filePath = path.join(__dirname, photoUrl); // Формируем полный путь к файлу
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file from disk: ${filePath}`, err);
          // Продолжаем, даже если не удалось удалить файл с диска,
          // так как запись из БД уже удалена. Возможно, нужно логировать ошибку.
        } else {
          console.log(`Successfully deleted file from disk: ${filePath}`);
        }
      });
    } else {
      console.warn(`File not found on disk: ${filePath}. Skipping deletion.`);
    }

    await client.query('COMMIT');
    res.json({ message: 'Фотография успешно удалена!', id: deleteResult.rows[0].id });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error deleting photo with ID ${photoId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении фотографии.' });
  } finally {
    client.release();
  }
});

// Получить всех пользователей
app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users GET route handler.');
  try {
    const result = await pool.query('SELECT id, email, name, phone, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка пользователей.' });
  }
});

// Получить пользователя по ID
app.get('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users/:id GET route handler.');
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, email, name, phone, is_admin, created_at, updated_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching user with ID ${id} for admin:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении данных пользователя.' });
  }
});

// Добавить нового пользователя (для админа)
app.post('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users POST route handler.');
  const { email, password, name, phone, is_admin } = req.body;

  const phoneRegex = /^\+7\d{10}$/;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, пароль и имя обязательны.' });
  }
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, phone, is_admin',
      [email, hashedPassword, name, phone, is_admin || false] // По умолчанию is_admin = false
    );
    res.status(201).json({ message: 'Пользователь успешно добавлен!', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' });
    }
    console.error('Error adding user by admin:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении пользователя.' });
  }
});

// Обновить данные пользователя (для админа)
app.put('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users PUT route handler.');
  const { id } = req.params;
  const { email, password, name, phone, is_admin } = req.body;

  const phoneRegex = /^\+7\d{10}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  }

  try {
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      queryParams.push(email);
    }
    if (password !== undefined && password !== '') { // Обновляем пароль только если он передан
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password_hash = $${paramIndex++}`);
      queryParams.push(hashedPassword);
    }
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      queryParams.push(phone);
    }
    if (is_admin !== undefined) {
      updateFields.push(`is_admin = $${paramIndex++}`);
      queryParams.push(is_admin);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Нет данных для обновления.' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(id); // Последний параметр - ID пользователя

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, phone, is_admin`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    res.json({ message: 'Данные пользователя успешно обновлены!', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' });
    }
    console.error(`Error updating user with ID ${id} by admin:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении данных пользователя.' });
  }
});

// Удалить пользователя (для админа)
app.delete('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users DELETE route handler.');
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    res.json({ message: 'Пользователь успешно удален!', id: result.rows[0].id });
  } catch (error) {
    console.error(`Error deleting user with ID ${id} by admin:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя.' });
  }
});

// Маршрут для отправки сообщения обратной связи
app.post('/api/feedback', async (req, res) => {
  console.log('[DEBUG] Reached /api/feedback POST route handler.');
  const { name, phone, email, subject, message } = req.body;

  // Базовая валидация на сервере
  if (!name || !phone || !email || !subject || !message) {
    return res.status(400).json({ message: 'Все поля формы обратной связи обязательны.' });
  }

  const phoneRegex = /^\+7\d{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Введите корректный Email.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO feedback_messages (name, phone, email, subject, message, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [name, phone, email, subject, message]
    );
    res.status(201).json({ message: 'Сообщение обратной связи успешно отправлено!', feedback: result.rows[0] });
  } catch (error) {
    console.error('Error saving feedback message:', error);
    res.status(500).json({ message: 'Ошибка сервера при сохранении сообщения обратной связи.' });
  }
});

// --- Маршруты для админ-панели: получение сообщений обратной связи (НОВОЕ) ---
app.get('/api/admin/feedback', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/feedback GET route handler.');
  try {
    const result = await pool.query('SELECT * FROM feedback_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback messages for admin:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении сообщений обратной связи.' });
  }
});

// --- Маршрут для удаления сообщения обратной связи (НОВОЕ) ---
app.delete('/api/admin/feedback/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/feedback DELETE route handler.');
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM feedback_messages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сообщение обратной связи не найдено.' });
    }
    res.json({ message: 'Сообщение обратной связи успешно удалено!', id: result.rows[0].id });
  } catch (error) {
    console.error(`Error deleting feedback message with ID ${id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении сообщения обратной связи.' });
  }
});

// --- API для АДМИН-ПАНЕЛИ (требует authorizeAdmin) ---

// Получить список всех пользователей (только для админов)
app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователей.' });
  }
});

// Изменить роль пользователя (только для админов)
app.put('/api/admin/users/:id/role', authenticateToken, authorizeAdmin, async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const validRoles = ['user', 'admin'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ message: 'Недопустимая роль.' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    res.json({ message: 'Роль пользователя успешно обновлена!', user: result.rows[0] });
  } catch (error) {
    console.error(`Error updating role for user ID ${userId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении роли пользователя.' });
  }
});

// Получить все заявки (только для админов)
// --- ОБНОВЛЕНО: Получение информации об автомобилях в заявке ---
app.get('/api/admin/applications', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.user_id,
        u.username,
        u.email,
        r.car_ids,
        r.status,
        r.created_at
      FROM requests r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC;
    `);

    // Для каждой заявки получаем детали автомобилей
    const requestsWithCarDetails = [];
    for (const request of result.rows) {
      const carDetails = [];
      if (request.car_ids && request.car_ids.length > 0) {
        // Получаем информацию обо всех автомобилях, указанных в car_ids
        const carsResult = await pool.query(
          `SELECT id, make, model, price, (SELECT image_url FROM car_photos WHERE car_id = c.id AND is_main = TRUE LIMIT 1) AS thumbnail_url
           FROM cars c WHERE id = ANY($1::int[])`,
          [request.car_ids]
        );
        carDetails.push(...carsResult.rows);
      }
      requestsWithCarDetails.push({ ...request, cars: carDetails });
    }

    res.json(requestsWithCarDetails);
  } catch (error) {
    console.error('Error fetching all requests for admin:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении всех заявок.' });
  }
});
// --- КОНЕЦ ОБНОВЛЕНИЯ МАРШРУТА ---

// PUT /api/admin/requests/:id/status - Изменить статус заявки (только для админов)
app.put('/api/admin/applications/:id/status', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/applications/:id/status PUT route handler.');
  const requestId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['new', 'in_process', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус заявки.' });
  }

  try {
    const result = await pool.query(
      'UPDATE requests SET status = $1 WHERE id = $2 RETURNING id, status, user_id, car_ids, created_at', // Возвращаем car_ids
      [status, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заявка не найдена.' });
    }

    const updatedRequest = result.rows[0];
    // Получаем детали автомобилей для обновленной заявки
    const carDetails = [];
    if (updatedRequest.car_ids && updatedRequest.car_ids.length > 0) {
      const carsResult = await pool.query(
        `SELECT id, make, model, price, (SELECT image_url FROM car_photos WHERE car_id = c.id AND is_main = TRUE LIMIT 1) AS thumbnail_url
         FROM cars c WHERE id = ANY($1::int[])`,
        [updatedRequest.car_ids]
      );
      carDetails.push(...carsResult.rows);
    }

    res.json({ message: 'Статус заявки успешно обновлен!', request: { ...updatedRequest, cars: carDetails } });
  } catch (error) {
    console.error(`Error updating status for request ID ${requestId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении статуса заявки.' });
  }
});


// Добавление нового автомобиля (только для админов)
app.post('/api/admin/cars', authenticateToken, authorizeAdmin, async (req, res) => {
  const { make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation } = req.body;

  if (!make || !model || !price) {
    return res.status(400).json({ message: 'Марка, модель и цена обязательны.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cars (make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation;`,
      [make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation]
    );
    res.status(201).json({ message: 'Автомобиль успешно добавлен!', car: result.rows[0] });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении автомобиля.' });
  }
});

// Обновление существующего автомобиля (только для админов)
app.put('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const carId = req.params.id;
  const { make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation } = req.body;

  if (!make || !model || !price) {
    return res.status(400).json({ message: 'Марка, модель и цена обязательны.' });
  }

  try {
    const result = await pool.query(
      `UPDATE cars SET
         make = $1, model = $2, price = $3, year = $4, engine_type = $5,
         horsepower = $6, acceleration_0_100 = $7, range = $8, drive_type = $9,
         color = $10, engine_volume = $11, body_type = $12, transmission = $13,
         mileage = $14, generation = $15
       WHERE id = $16
       RETURNING id, make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation;`,
      [make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation, carId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }
    res.json({ message: 'Автомобиль успешно обновлен!', car: result.rows[0] });
  } catch (error) {
    console.error(`Error updating car with ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении автомобиля.' });
  }
});

// Удаление автомобиля (только для админов)
app.delete('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const carId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING id', [carId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }
    res.json({ message: 'Автомобиль успешно удален!' });
  } catch (error) {
    console.error(`Error deleting car with ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении автомобиля.' });
  }
});

// Загрузка фотографий для автомобиля (только для админов)
app.post('/api/admin/cars/:carId/photos', authenticateToken, authorizeAdmin, upload.array('photos', 10), async (req, res) => {
  const carId = parseInt(req.params.carId);
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Необходимо загрузить хотя бы одно изображение.' });
  }

  try {
    // Проверяем, существует ли автомобиль
    const carCheck = await pool.query('SELECT id FROM cars WHERE id = $1', [carId]);
    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден.' });
    }

    const uploadedPhotos = [];
    for (const file of files) {
      const imageUrl = `/uploads/${file.filename}`; // URL для доступа к файлу
      const result = await pool.query(
        'INSERT INTO car_photos (car_id, url) VALUES ($1, $2) RETURNING id, car_id, url, is_main, order_index',
        [carId, imageUrl]
      );
      uploadedPhotos.push({ ...result.rows[0], image_url: result.rows[0].url }); // Переименовываем url в image_url для консистентности
    }
    res.status(201).json({ message: 'Изображения успешно загружены!', photos: uploadedPhotos });
  } catch (error) {
    console.error(`Error uploading photos for car ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при загрузке изображений.' });
  }
});

// Установить главную фотографию для автомобиля (только для админов)
// --- ИСПРАВЛЕНО: Маршрут теперь соответствует '/api/admin/photos/:photoId/set-main' ---
app.put('/api/admin/photos/:photoId/set-main', authenticateToken, authorizeAdmin, async (req, res) => {
  const photoId = req.params.photoId;
  try {
    // Получаем car_id для данной фотографии
    const photoResult = await pool.query('SELECT car_id FROM car_photos WHERE id = $1', [photoId]);
    if (photoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Фотография не найдена.' });
    }
    const carId = photoResult.rows[0].car_id;

    // Сбрасываем is_main для всех фотографий этого автомобиля
    await pool.query('UPDATE car_photos SET is_main = FALSE WHERE car_id = $1', [carId]);

    // Устанавливаем is_main для выбранной фотографии
    const result = await pool.query(
      'UPDATE car_photos SET is_main = TRUE WHERE id = $1 RETURNING id, car_id, url, is_main',
      [photoId]
    );

    res.json({ message: 'Главная фотография успешно установлена!', photo: result.rows[0] });
  } catch (error) {
    console.error(`Error setting main photo for ID ${photoId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при установке главной фотографии.' });
  }
});

// Удаление фотографии автомобиля (только для админов)
app.delete('/api/admin/photos/:photoId', authenticateToken, authorizeAdmin, async (req, res) => {
  const photoId = req.params.photoId;
  try {
    const result = await pool.query('DELETE FROM car_photos WHERE id = $1 RETURNING id, url', [photoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Фотография не найдена.' });
    }

    // Опционально: удалить файл с диска
    // const filePath = path.join(__dirname, 'uploads', path.basename(result.rows[0].url));
    // fs.unlink(filePath, (err) => {
    //   if (err) console.error('Error deleting file from disk:', err);
    // });

    res.json({ message: 'Фотография успешно удалена!' });
  } catch (error) {
    console.error(`Error deleting photo with ID ${photoId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении фотографии.' });
  }
});


// Получение всех сообщений обратной связи (только для админов)
app.get('/api/admin/feedback', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, user_id, message, created_at FROM feedback ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback messages for admin:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении сообщений обратной связи.' });
  }
});

// Удаление сообщения обратной связи (только для админов)
app.delete('/api/admin/feedback/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const messageId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM feedback WHERE id = $1 RETURNING id', [messageId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сообщение не найдено.' });
    }
    res.json({ message: 'Сообщение успешно удалено.' });
  } catch (error) {
    console.error(`Error deleting feedback message ID ${messageId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении сообщения.' });
  }
});

// POST /api/requests - Создать новую заявку из избранных автомобилей
app.post('/api/applications', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/requests POST route handler.');
  const userId = req.user.id; // ID пользователя из токена
  const { carIds } = req.body; // Ожидаем массив car_id

  if (!Array.isArray(carIds) || carIds.length === 0) {
    return res.status(400).json({ message: 'Массив ID автомобилей не может быть пустым.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Начать транзакцию

    // 1. Создать новую заявку в таблице requests
    const requestResult = await client.query(
      'INSERT INTO requests (user_id, status) VALUES ($1, $2) RETURNING id',
      [userId, 'new'] // Начальный статус 'new'
    );
    const requestId = requestResult.rows[0].id;

    // 2. Добавить каждый автомобиль в request_items
    for (const carId of carIds) {
      // Опционально: Проверяем, существует ли автомобиль, чтобы избежать ошибок внешнего ключа
      const carCheck = await client.query('SELECT id FROM cars WHERE id = $1', [carId]);
      if (carCheck.rows.length === 0) {
        console.warn(`[WARN] Car with ID ${carId} not found for request ${requestId}. Skipping.`);
        continue; // Пропускаем несуществующий автомобиль
      }
      await client.query(
        'INSERT INTO request_items (request_id, car_id, quantity) VALUES ($1, $2, $3)',
        [requestId, carId, 1] // quantity по умолчанию 1
      );
    }

    await client.query('COMMIT'); // Завершить транзакцию
    res.status(201).json({ message: 'Заявка успешно создана!', requestId: requestId });

  } catch (error) {
    await client.query('ROLLBACK'); // Откатить транзакцию в случае ошибки
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании заявки.' });
  } finally {
    client.release();
  }
});






// Старт сервера
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

