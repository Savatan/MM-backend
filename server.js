// server.js

// Загружаем переменные окружения из файла .env
require('dotenv').config();

const express = require('express');
const path = require('path');
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

app.use('/uploads', express.static('uploads'));
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

require('dotenv').config();

const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static('uploads'));
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage: storage });

const frontendDistPath = path.join(__dirname, '..', 'car-dealership-frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  console.log('[INFO] Frontend dist detected, serving static files from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(frontendDistPath, 'index.html')));
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client to PostgreSQL database:', err.stack);
    return;
  }
  console.log('Connected to PostgreSQL database successfully!');
  release();
});

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => await bcrypt.compare(password, hashedPassword);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ message: 'Требуется токен аутентификации.' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ message: 'Неверный или просроченный токен.' });
    }
    req.user = user;
    next();
  });
};
const verifyToken = authenticateToken;
const authorizeAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ message: 'Доступ запрещен: требуются права администратора.' });
  next();
};

app.get('/', (req, res) => res.send('Welcome to the Car Dealership Backend API!'));

app.post('/api/auth/register', async (req, res) => {
  console.log('[DEBUG] Reached /api/auth/register route handler.');
  const { email, password, name, phone } = req.body;
  const phoneRegex = /^\+7\d{10}$/;
  if (!email || !password || !name || !phone) return res.status(400).json({ message: 'Email, пароль, имя и телефон обязательны.' });
  if (!phoneRegex.test(phone)) return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  try {
    const hashedPassword = await hashPassword(password);
    const result = await pool.query('INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, phone, is_admin', [email, hashedPassword, name, phone]);
    const user = result.rows[0];
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован!', user: { id: user.id, email: user.email, name: user.name, phone: user.phone } });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' });
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ошибка сервера во время регистрации.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('[DEBUG] Reached /api/auth/login route handler.');
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Неверные учетные данные.' });
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Неверные учетные данные.' });
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Вход выполнен успешно!', token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, is_admin: user.is_admin } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Ошибка сервера во время входа.' });
  }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/user/profile route handler.');
  try {
    const result = await pool.query('SELECT id, email, name, phone, is_admin, created_at FROM users WHERE id = $1', [req.user.id]);
    const userProfile = result.rows[0];
    if (!userProfile) return res.status(404).json({ message: 'Профиль пользователя не найден.' });
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля пользователя.' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/user/profile PUT route handler.');
  const userId = req.user.id;
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Имя и Email обязательны для обновления профиля.' });
  const phoneRegex = /^\+7\d{10}$/;
  if (phone && !phoneRegex.test(phone)) return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  try {
    const result = await pool.query(`UPDATE users SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, email, name, phone, is_admin, created_at`, [name, email, phone, userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' });
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля.' });
  }
});

app.delete('/api/user/profile', authenticateToken, async (req, res) => {
  console.log('[DEBUG] Reached /api/user/profile DELETE route handler.');
  const userId = req.user.id;
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' });
    res.json({ message: 'Профиль успешно удален!' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении профиля.' });
  }
});

app.get('/api/cars', async (req, res) => {
  console.log('[DEBUG] Reached /api/cars GET route handler');
  try {
    const result = await pool.query(`SELECT c.*, (SELECT cp.url FROM car_photos cp WHERE cp.car_id = c.id AND cp.is_main = TRUE LIMIT 1) AS thumbnail_url FROM cars c ORDER BY c.id ASC;`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка автомобилей.' });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  console.log('[DEBUG] Reached /api/cars/:id route handler.');
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Автомобиль не найден.' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching car with ID ${id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении автомобиля.' });
  }
});

app.get('/api/cars/:id/photos', async (req, res) => {
  console.log(`[DEBUG] Reached /api/cars/:id/photos GET route handler for car ID: ${req.params.id}`);
  const carId = req.params.id;
  try {
    const result = await pool.query('SELECT id, car_id, url AS image_url, is_main, order_index FROM car_photos WHERE car_id = $1 ORDER BY order_index ASC', [carId]);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching photos for car ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении фотографий автомобиля.' });
  }
});

app.get('/api/user/requests', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const port = process.env.PORT || 3000;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;
  try {
    const requestsResult = await pool.query('SELECT id, status, created_at FROM requests WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    if (requestsResult.rows.length === 0) return res.json([]);
    const requests = requestsResult.rows;
    const requestIds = requests.map(r => r.id);
    const itemsResult = await pool.query(`SELECT ri.request_id, c.id AS car_id, c.make, c.model, c.price FROM request_items ri JOIN cars c ON ri.car_id = c.id WHERE ri.request_id = ANY($1::int[]) ORDER BY ri.request_id`, [requestIds]);
    const items = itemsResult.rows;
    const totalPricesMap = new Map();
    const groupedItems = items.reduce((acc, item) => {
      const price = item.price ? parseFloat(item.price) : 0;
      const carDetail = { id: item.car_id, make: item.make, model: item.model, price };
      const currentTotal = totalPricesMap.get(item.request_id) || 0;
      totalPricesMap.set(item.request_id, currentTotal + price);
      if (!acc[item.request_id]) acc[item.request_id] = [];
      acc[item.request_id].push(carDetail);
      return acc;
    }, {});
    const finalRequests = requests.map(request => ({ ...request, cars: groupedItems[request.id] || [], total_price: parseFloat(((totalPricesMap.get(request.id) || 0)).toFixed(2)) }));
    res.json(finalRequests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка ваших заявок.' });
  }
});

app.delete('/api/requests/:requestId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const requestId = parseInt(req.params.requestId);
  if (isNaN(requestId)) return res.status(400).json({ message: 'Неверный ID заявки.' });
  try {
    const deleteResult = await pool.query('DELETE FROM requests WHERE id = $1 AND user_id = $2 AND status = $3 RETURNING id', [requestId, userId, 'new']);
    if (deleteResult.rows.length === 0) return res.status(403).json({ message: 'Невозможно удалить (отменить) заявку. Возможно, она уже в обработке или не принадлежит вам.' });
    res.status(200).json({ message: `Заявка №${requestId} успешно отменена.` });
  } catch (error) {
    console.error(`Error deleting request ${requestId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении заявки.' });
  }
});

app.post('/api/admin/cars', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/cars POST route handler.');
  const { make, model, engine_type, horsepower, acceleration_0_100, range, drive_type, color, year, engine_volume, body_type, transmission, mileage, price, description, stock_quantity } = req.body;
  if (!make || !model || !year || !price) return res.status(400).json({ message: 'Марка, модель, год и цена обязательны для автомобиля.' });
  try {
    const result = await pool.query(`INSERT INTO cars (make, model, engine_type, horsepower, acceleration_0_100, range, drive_type, color, year, engine_volume, body_type, transmission, mileage, price, description, stock_quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`, [make, model, engine_type, horsepower, acceleration_0_100, range, drive_type, color, year, engine_volume, body_type, transmission, mileage, price, description, stock_quantity]);
    res.status(201).json({ message: 'Автомобиль успешно добавлен!', car: result.rows[0] });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении автомобиля.' });
  }
});

app.put('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/cars PUT route handler.');
  const { id } = req.params;
  const { make, model, engine_type, horsepower, acceleration_0_100, range, drive_type, color, year, engine_volume, body_type, transmission, mileage, price, description, stock_quantity } = req.body;
  try {
    const result = await pool.query(`UPDATE cars SET make = COALESCE($1, make), model = COALESCE($2, model), engine_type = COALESCE($3, engine_type), horsepower = COALESCE($4, horsepower), acceleration_0_100 = COALESCE($5, acceleration_0_100), range = COALESCE($6, range), drive_type = COALESCE($7, drive_type), color = COALESCE($8, color), year = COALESCE($9, year), engine_volume = COALESCE($10, engine_volume), body_type = COALESCE($11, body_type), transmission = COALESCE($12, transmission), mileage = COALESCE($13, mileage), price = COALESCE($14, price), description = COALESCE($15, description), stock_quantity = COALESCE($16, stock_quantity), updated_at = CURRENT_TIMESTAMP WHERE id = $17 RETURNING *`, [make, model, engine_type, horsepower, acceleration_0_100, range, drive_type, color, year, engine_volume, body_type, transmission, mileage, price, description, stock_quantity, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Автомобиль не найден.' });
    res.json({ message: 'Автомобиль успешно обновлен!', car: result.rows[0] });
  } catch (error) {
    console.error(`Error updating car with ID ${id}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении автомобиля.' });
  }
});

app.delete('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const carId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING id', [carId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Автомобиль не найден.' });
    res.json({ message: 'Автомобиль успешно удален!' });
  } catch (error) {
    console.error(`Error deleting car with ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении автомобиля.' });
  }
});

app.post('/api/admin/cars/:carId/photos', authenticateToken, authorizeAdmin, upload.array('photos', 10), async (req, res) => {
  console.log(`[DEBUG] Reached /api/admin/cars/:carId/photos POST route handler for car ID: ${req.params.carId}`);
  const carId = req.params.carId;
  if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Файлы для загрузки отсутствуют.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const carCheck = await client.query('SELECT id FROM cars WHERE id = $1', [carId]);
    if (carCheck.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Автомобиль не найден.' }); }
    const uploadedPhotos = [];
    for (const file of req.files) {
      const imageUrl = `/uploads/${file.filename}`;
      const result = await client.query('INSERT INTO car_photos (car_id, url) VALUES ($1, $2) RETURNING id, car_id, url, is_main, order_index', [carId, imageUrl]);
      uploadedPhotos.push(result.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Фотографии успешно загружены!', photos: uploadedPhotos });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error uploading photos for car ID ${carId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при загрузке фотографий.' });
  } finally { client.release(); }
});

app.put('/api/admin/photos/:photoId/set-main', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log(`[DEBUG] Reached /api/admin/photos/:photoId/set-main PUT route handler for photo ID: ${req.params.photoId}`);
  const photoId = req.params.photoId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const photoResult = await client.query('SELECT car_id FROM car_photos WHERE id = $1', [photoId]);
    if (photoResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Фотография не найдена.' }); }
    const carId = photoResult.rows[0].car_id;
    await client.query('UPDATE car_photos SET is_main = FALSE WHERE car_id = $1', [carId]);
    const updateResult = await client.query('UPDATE car_photos SET is_main = TRUE WHERE id = $1 RETURNING id, car_id, url, is_main', [photoId]);
    await client.query('COMMIT');
    res.json({ message: 'Главная фотография успешно установлена!', photo: updateResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error setting main photo for photo ID ${photoId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при установке главной фотографии.' });
  } finally { client.release(); }
});

app.delete('/api/admin/photos/:photoId', authenticateToken, authorizeAdmin, async (req, res) => {
  const photoId = req.params.photoId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const photoResult = await client.query('SELECT url FROM car_photos WHERE id = $1', [photoId]);
    if (photoResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Фотография не найдена.' }); }
    const photoUrl = photoResult.rows[0].url;
    const deleteResult = await client.query('DELETE FROM car_photos WHERE id = $1 RETURNING id', [photoId]);
    if (deleteResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Фотография не найдена или уже удалена.' }); }
    const filePath = path.join(__dirname, photoUrl);
    if (fs.existsSync(filePath)) fs.unlink(filePath, (err) => { if (err) console.error(`Error deleting file from disk: ${filePath}`, err); else console.log(`Successfully deleted file from disk: ${filePath}`); });
    await client.query('COMMIT');
    res.json({ message: 'Фотография успешно удалена!', id: deleteResult.rows[0].id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error deleting photo with ID ${photoId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении фотографии.' });
  } finally { client.release(); }
});

app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users GET route handler.');
  try { const result = await pool.query('SELECT id, email, name, phone, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC'); res.json(result.rows); } catch (error) { console.error('Error fetching users for admin:', error); res.status(500).json({ message: 'Ошибка сервера при получении списка пользователей.' }); }
});

app.get('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users/:id GET route handler.');
  const { id } = req.params;
  try { const result = await pool.query('SELECT id, email, name, phone, is_admin, created_at, updated_at FROM users WHERE id = $1', [id]); if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' }); res.json(result.rows[0]); } catch (error) { console.error(`Error fetching user with ID ${id} for admin:`, error); res.status(500).json({ message: 'Ошибка сервера при получении данных пользователя.' }); }
});

app.post('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users POST route handler.');
  const { email, password, name, phone, is_admin } = req.body;
  const phoneRegex = /^\+7\d{10}$/;
  if (!email || !password || !name) return res.status(400).json({ message: 'Email, пароль и имя обязательны.' });
  if (phone && !phoneRegex.test(phone)) return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  try { const hashedPassword = await hashPassword(password); const result = await pool.query('INSERT INTO users (email, password_hash, name, phone, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, phone, is_admin', [email, hashedPassword, name, phone, is_admin || false]); res.status(201).json({ message: 'Пользователь успешно добавлен!', user: result.rows[0] }); } catch (error) { if (error.code === '23505') return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' }); console.error('Error adding user by admin:', error); res.status(500).json({ message: 'Ошибка сервера при добавлении пользователя.' }); }
});

app.put('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/users PUT route handler.');
  const { id } = req.params; const { email, password, name, phone, is_admin } = req.body; const phoneRegex = /^\+7\d{10}$/; if (phone && !phoneRegex.test(phone)) return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  try {
    let updateFields = []; let queryParams = []; let paramIndex = 1;
    if (email !== undefined) { updateFields.push(`email = $${paramIndex++}`); queryParams.push(email); }
    if (password !== undefined && password !== '') { const hashedPassword = await hashPassword(password); updateFields.push(`password_hash = $${paramIndex++}`); queryParams.push(hashedPassword); }
    if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); queryParams.push(name); }
    if (phone !== undefined) { updateFields.push(`phone = $${paramIndex++}`); queryParams.push(phone); }
    if (is_admin !== undefined) { updateFields.push(`is_admin = $${paramIndex++}`); queryParams.push(is_admin); }
    if (updateFields.length === 0) return res.status(400).json({ message: 'Нет данных для обновления.' });
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`); queryParams.push(id);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, phone, is_admin`;
    const result = await pool.query(query, queryParams);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' });
    res.json({ message: 'Данные пользователя успешно обновлены!', user: result.rows[0] });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ message: 'Пользователь с таким Email уже существует.' }); console.error(`Error updating user with ID ${id} by admin:`, error); res.status(500).json({ message: 'Ошибка сервера при обновлении данных пользователя.' }); }
});

app.delete('/api/admin/users/:id', authenticateToken, authorizeAdmin, async (req, res) => { console.log('[DEBUG] Reached /api/admin/users DELETE route handler.'); const { id } = req.params; try { const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]); if (result.rows.length === 0) return res.status(404).json({ message: 'Пользователь не найден.' }); res.json({ message: 'Пользователь успешно удален!', id: result.rows[0].id }); } catch (error) { console.error(`Error deleting user with ID ${id} by admin:`, error); res.status(500).json({ message: 'Ошибка сервера при удалении пользователя.' }); });

app.post('/api/feedback', async (req, res) => {
  console.log('[DEBUG] Reached /api/feedback POST route handler.');
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !email || !subject || !message) return res.status(400).json({ message: 'Все поля формы обратной связи обязательны.' });
  const phoneRegex = /^\+7\d{10}$/; if (!phoneRegex.test(phone)) return res.status(400).json({ message: 'Неверный формат номера телефона. Используйте +7ХХХХХХХХХХ.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Введите корректный Email.' });
  try { const result = await pool.query(`INSERT INTO feedback_messages (name, phone, email, subject, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`, [name, phone, email, subject, message]); res.status(201).json({ message: 'Сообщение обратной связи успешно отправлено!', feedback: result.rows[0] }); } catch (error) { console.error('Error saving feedback message:', error); res.status(500).json({ message: 'Ошибка сервера при сохранении сообщения обратной связи.' }); }
});

app.get('/api/admin/feedback', authenticateToken, authorizeAdmin, async (req, res) => { try { const result = await pool.query('SELECT * FROM feedback_messages ORDER BY created_at DESC'); res.json(result.rows); } catch (error) { console.error('Error fetching feedback messages for admin:', error); res.status(500).json({ message: 'Ошибка сервера при получении сообщений обратной связи.' }); } });

app.delete('/api/admin/feedback/:id', authenticateToken, authorizeAdmin, async (req, res) => { console.log('[DEBUG] Reached /api/admin/feedback DELETE route handler.'); const { id } = req.params; try { const result = await pool.query('DELETE FROM feedback_messages WHERE id = $1 RETURNING id', [id]); if (result.rows.length === 0) return res.status(404).json({ message: 'Сообщение обратной связи не найдено.' }); res.json({ message: 'Сообщение обратной связи успешно удалено!', id: result.rows[0].id }); } catch (error) { console.error(`Error deleting feedback message with ID ${id}:`, error); res.status(500).json({ message: 'Ошибка сервера при удалении сообщения обратной связи.' }); } });

app.get('/api/admin/requests', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const requestsResult = await pool.query(`SELECT r.id, r.user_id, u.name, u.email, r.status, r.created_at, ARRAY_AGG(ri.car_id) AS car_ids FROM requests r JOIN users u ON r.user_id = u.id LEFT JOIN request_items ri ON r.id = ri.request_id GROUP BY r.id, u.name, u.email, r.user_id, r.status, r.created_at ORDER BY r.created_at DESC;`);
    const requests = requestsResult.rows;
    const allCarIds = Array.from(new Set(requests.flatMap(req => req.car_ids ? req.car_ids.filter(id => id != null) : [])));
    let carDetailsMap = new Map();
    if (allCarIds.length > 0) { const carsResult = await pool.query(`SELECT c.id, c.make, c.model, c.price, cp.url AS thumbnail_url FROM cars c LEFT JOIN car_photos cp ON c.id = cp.car_id AND cp.is_main = TRUE WHERE c.id = ANY($1::int[])`, [allCarIds]); carsResult.rows.forEach(car => carDetailsMap.set(car.id, car)); }
    const requestsWithCarDetails = requests.map(request => { let carIdsArray = request.car_ids ? request.car_ids.filter(id => id != null) : []; const carDetails = carIdsArray.map(carId => carDetailsMap.get(carId)).filter(car => car !== undefined); return { ...request, cars: carDetails, car_ids: carIdsArray }; });
    res.json(requestsWithCarDetails);
  } catch (error) { console.error('Error fetching all requests for admin:', error); res.status(500).json({ message: 'Ошибка сервера при получении всех заявок.' }); }
});

app.put('/api/admin/applications/:id/status', authenticateToken, authorizeAdmin, async (req, res) => {
  console.log('[DEBUG] Reached /api/admin/applications/:id/status PUT route handler.');
  const requestId = req.params.id; const { status } = req.body; const validStatuses = ['new', 'in_process', 'completed', 'cancelled']; if (!status || !validStatuses.includes(status)) return res.status(400).json({ message: 'Недопустимый статус заявки.' });
  try { const result = await pool.query('UPDATE requests SET status = $1 WHERE id = $2 RETURNING id, status, user_id, car_ids, created_at', [status, requestId]); if (result.rows.length === 0) return res.status(404).json({ message: 'Заявка не найдена.' }); const updatedRequest = result.rows[0]; const carDetails = []; if (updatedRequest.car_ids && updatedRequest.car_ids.length > 0) { const carsResult = await pool.query(`SELECT id, make, model, price, (SELECT image_url FROM car_photos WHERE car_id = c.id AND is_main = TRUE LIMIT 1) AS thumbnail_url FROM cars c WHERE id = ANY($1::int[])`, [updatedRequest.car_ids]); carDetails.push(...carsResult.rows); } res.json({ message: 'Статус заявки успешно обновлен!', request: { ...updatedRequest, cars: carDetails } }); } catch (error) { console.error(`Error updating status for request ID ${requestId}:`, error); res.status(500).json({ message: 'Ошибка сервера при обновлении статуса заявки.' }); }
});

app.post('/api/admin/cars', authenticateToken, authorizeAdmin, async (req, res) => {
  const { make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation } = req.body; if (!make || !model || !price) return res.status(400).json({ message: 'Марка, модель и цена обязательны.' }); try { const result = await pool.query(`INSERT INTO cars (make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id, make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation;`, [make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation]); res.status(201).json({ message: 'Автомобиль успешно добавлен!', car: result.rows[0] }); } catch (error) { console.error('Error adding car:', error); res.status(500).json({ message: 'Ошибка сервера при добавлении автомобиля.' }); }
});

app.put('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const carId = req.params.id; const { make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation } = req.body; if (!make || !model || !price) return res.status(400).json({ message: 'Марка, модель и цена обязательны.' }); try { const result = await pool.query(`UPDATE cars SET make = $1, model = $2, price = $3, year = $4, engine_type = $5, horsepower = $6, acceleration_0_100 = $7, range = $8, drive_type = $9, color = $10, engine_volume = $11, body_type = $12, transmission = $13, mileage = $14, generation = $15 WHERE id = $16 RETURNING id, make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation;`, [make, model, price, year, engine_type, horsepower, acceleration_0_100, range, drive_type, color, engine_volume, body_type, transmission, mileage, generation, carId]); if (result.rows.length === 0) return res.status(404).json({ message: 'Автомобиль не найден.' }); res.json({ message: 'Автомобиль успешно обновлен!', car: result.rows[0] }); } catch (error) { console.error(`Error updating car with ID ${carId}:`, error); res.status(500).json({ message: 'Ошибка сервера при обновлении автомобиля.' }); }
});

app.delete('/api/admin/cars/:id', authenticateToken, authorizeAdmin, async (req, res) => { const carId = req.params.id; try { const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING id', [carId]); if (result.rows.length === 0) return res.status(404).json({ message: 'Автомобиль не найден.' }); res.json({ message: 'Автомобиль успешно удален!' }); } catch (error) { console.error(`Error deleting car with ID ${carId}:`, error); res.status(500).json({ message: 'Ошибка сервера при удалении автомобиля.' }); });

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

// --- НОВОЕ: ЭНДПОЙНТ ДЛЯ УДАЛЕНИЯ ЗАЯВКИ (ЗАКАЗА) ---
// DELETE /api/requests/:id
app.delete('/api/requests/:id', verifyToken, async (req, res) => {
  const requestId = parseInt(req.params.id);
  const userId = req.userId; // Получен из verifyToken

  if (isNaN(requestId)) {
    return res.status(400).json({ message: 'Неверный ID заявки.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Начать транзакцию

    // 1. Проверка прав: Убедиться, что заявка принадлежит пользователю И что она новая
    const requestCheck = await client.query('SELECT user_id, status FROM requests WHERE id = $1', [requestId]);

    if (requestCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Заявка не найдена.' });
    }

    const requestOwnerId = requestCheck.rows[0].user_id;
    const requestStatus = requestCheck.rows[0].status;

    // Пользователь может удалить только свою заявку И только если она в статусе 'new'
    if (requestOwnerId !== userId || requestStatus !== 'new') {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'У вас нет прав для удаления этой заявки или она уже не в статусе "новая".' });
    }

    // 2. Удалить связанные элементы (request_items)
    await client.query('DELETE FROM request_items WHERE request_id = $1', [requestId]);

    // 3. Удалить саму заявку (requests)
    await client.query('DELETE FROM requests WHERE id = $1', [requestId]);

    await client.query('COMMIT'); // Завершить транзакцию
    res.status(200).json({ message: 'Заявка успешно удалена.' });

  } catch (error) {
    await client.query('ROLLBACK'); // Откатить транзакцию в случае ошибки
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении заявки.' });
  } finally {
    client.release();
  }
});

// --- КОНЕЦ НОВОГО ЭНДПОЙНТА ДЛЯ УДАЛЕНИЯ ---

// POST /api/requests - Создать новую заявку из избранных автомобилей
app.post('/api/requests', authenticateToken, async (req, res) => {
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
// Перед запуском сервера убедимся, что схема БД и сиды применены (если есть файлы schema.sql / seed.sql)
async function ensureSchemaAndSeed() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      if (schemaSql.trim()) {
        console.log('[INFO] Applying DB schema from', schemaPath);
        // Выполняем весь SQL из файла (может содержать несколько операторов разделённых ';')
        await pool.query(schemaSql);
        console.log('[INFO] Schema applied');
      }
    } else {
      console.log('[INFO] No schema.sql found, skipping schema apply.');
    }

    // Если есть seed.sql и таблица cars пустая — применим сиды
    try {
      const countRes = await pool.query("SELECT COUNT(*)::int AS count FROM cars");
      const count = countRes.rows[0] && countRes.rows[0].count ? parseInt(countRes.rows[0].count, 10) : 0;
      if (count === 0) {
        const seedPath = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          if (seedSql.trim()) {
            console.log('[INFO] Applying seed data from', seedPath);
            await pool.query(seedSql);
            console.log('[INFO] Seed applied');
          }
        } else {
          console.log('[INFO] No seed.sql found, skipping seeds.');
        }
      } else {
        console.log(`[INFO] cars table contains ${count} rows, skipping seeds.`);
      }

      // Дополнительно: если есть seed_images.sql и в таблице cars мало записей, применим дополнительные сиды с фотографиями
      try {
        const imagesSeedPath = path.join(__dirname, 'seed_images.sql');
        if (fs.existsSync(imagesSeedPath)) {
          const currentCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM cars");
          const currentCount = currentCountRes.rows[0] && currentCountRes.rows[0].count ? parseInt(currentCountRes.rows[0].count, 10) : 0;
          // Применяем seed_images.sql если машин меньше чем 10
          if (currentCount < 10) {
            const seedImagesSql = fs.readFileSync(imagesSeedPath, 'utf8');
            if (seedImagesSql.trim()) {
              console.log('[INFO] Applying image-based seed data from', imagesSeedPath);
              // Выполняем как один запрос; если нужно, можно разделить по ';'
              await pool.query(seedImagesSql);
              console.log('[INFO] Image seeds applied');
            }
          } else {
            console.log(`[INFO] cars table contains ${currentCount} rows, skipping image seeds.`);
          }
        } else {
          console.log('[INFO] No seed_images.sql found, skipping image seeds.');
        }
      } catch (ie) {
        console.error('[WARN] Could not apply seed_images.sql:', ie.message);
      }

    } catch (e) {
      // Если произошла ошибка при SELECT (например таблицы ещё нет), попробуем применить schema и повторить
      console.warn('[WARN] Could not check cars count, it may be because the table does not exist yet:', e.message);
    }

  } catch (err) {
    console.error('[ERROR] Applying schema/seed:', err);
  }
}

ensureSchemaAndSeed().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((err) => {
  console.error('[FATAL] Failed to prepare database:', err);
  // Всё равно пытаемся запустить сервер — некоторые эндпойнты могут работать без БД
  app.listen(port, () => {
    console.log(`Server running on port ${port} (DB prepare failed)`);
  });
});

