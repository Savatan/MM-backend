-- seed.sql
-- Добавляет несколько тестовых записей в таблицы cars и car_photos

-- Примечание: Выполните этот файл после schema.sql в той же базе данных.

-- Пример: вставка автомобиля 1
INSERT INTO cars (make, model, year, price, description, stock_quantity)
VALUES ('Toyota', 'Camry', 2018, 1500000, 'Удобный седан, отличное состояние.', 3);
INSERT INTO car_photos (car_id, url, is_main, order_index)
VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/sample1.jpg', true, 1);

-- Пример: вставка автомобиля 2
INSERT INTO cars (make, model, year, price, description, stock_quantity)
VALUES ('BMW', 'X5', 2020, 5500000, 'Кроссовер премиум-класса.', 2);
INSERT INTO car_photos (car_id, url, is_main, order_index)
VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/sample2.jpg', true, 1);

-- Пример: вставка автомобиля 3
INSERT INTO cars (make, model, year, price, description, stock_quantity)
VALUES ('Tesla', 'Model 3', 2022, 4000000, 'Электромобиль с отличной динамикой.', 4);
INSERT INTO car_photos (car_id, url, is_main, order_index)
VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/sample3.jpg', true, 1);
