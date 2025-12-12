-- schema.sql
-- Простая схема для PostgreSQL, используемая этим проектом

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Таблица автомобилей
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  engine_type TEXT,
  horsepower INTEGER,
  acceleration_0_100 TEXT,
  range TEXT,
  drive_type TEXT,
  color TEXT,
  year INTEGER,
  engine_volume NUMERIC,
  body_type TEXT,
  transmission TEXT,
  mileage INTEGER,
  price NUMERIC NOT NULL,
  description TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Таблица фотографий автомобилей
CREATE TABLE IF NOT EXISTS car_photos (
  id SERIAL PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
  url TEXT,
  is_main BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Таблица заявок пользователей
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Таблица позиций в заявках
CREATE TABLE IF NOT EXISTS request_items (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1
);

-- Индексы (опционально, для ускорения некоторых запросов)
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_car_photos_car_id ON car_photos(car_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
