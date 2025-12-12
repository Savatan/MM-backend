-- seed_images.sql
-- Создаёт записи автомобилей и добавляет фотографии из папки web/uploads
-- Этот файл предполагает, что файлы картинок уже скопированы в /uploads или доступы через /web/uploads
-- Он использует currval(pg_get_serial_sequence('cars','id')) сразу после INSERT, поэтому выполняйте его в одной сессии.

-- 1) Aston Martin DB11
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Aston Martin','DB11',2019,12000000,'Aston Martin DB11 — спортивное купе.', 'V8 Twin-Turbo', 510, '4.0s', 'RWD', 'Black', 4.0, 'Coupe', 'Automatic', 20000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/aston_martin_db11_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/aston_martin_db11_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/aston_martin_db11_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/aston_martin_db11_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/aston_martin_db11_5.png', false, 5);

-- 2) Bentley Continental GT
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Bentley','Continental GT',2020,18000000,'Bentley Continental GT — роскошный гран-туризмо.', 'W12', 650, '3.6s', 'AWD', 'Dark Blue', 6.0, 'Coupe', 'Automatic', 15000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bentley_continental_gt_iii_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bentley_continental_gt_iii_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bentley_continental_gt_iii_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bentley_continental_gt_iii_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bentley_continental_gt_iii_5.png', false, 5);

-- 3) BMW 7 Series (G70)
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('BMW','7 Series G70',2022,9000000,'BMW 7 Series — представительский седан.', 'Inline-6 Turbo', 375, '4.8s', 'AWD', 'Gray', 3.0, 'Sedan', 'Automatic', 12000, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_7_seriya_g70_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_7_seriya_g70_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_7_seriya_g70_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_7_seriya_g70_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_7_seriya_g70_5.png', false, 5);

-- 4) BMW M5 Competition
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('BMW','M5 Competition',2021,11000000,'Высокопроизводительный седан BMW M5.', 'V8 Twin-Turbo', 625, '3.1s', 'RWD', 'Black', 4.4, 'Sedan', 'Automatic', 10000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_m5_competition_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_m5_competition_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_m5_competition_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_m5_competition_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bmw_m5_competition_5.png', false, 5);

-- 5) Bugatti Chiron
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Bugatti','Chiron',2019,200000000,'Bugatti Chiron — гиперкар.', 'W16', 1500, '2.4s', 'AWD', 'Blue', 8.0, 'Coupe', 'Automatic', 5000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bugatti_chiron_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bugatti_chiron_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bugatti_chiron_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bugatti_chiron_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/bugatti_chiron_5.png', false, 5);

-- 6) Cadillac Escalade V
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Cadillac','Escalade V',2023,14000000,'Крупный премиальный внедорожник.', 'V8 Twin-Turbo', 682, '4.4s', 'AWD', 'White', 6.2, 'SUV', 'Automatic', 8000, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/cadillac_escalade_v_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/cadillac_escalade_v_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/cadillac_escalade_v_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/cadillac_escalade_v_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/cadillac_escalade_v_5.png', false, 5);

-- 7) Ferrari Purosangue
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Ferrari','Purosangue',2023,30000000,'Первый SUV от Ferrari — Purosangue.', 'V12', 725, '3.3s', 'AWD', 'Red', 6.5, 'SUV', 'Automatic', 2000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/ferrari_purosangue_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/ferrari_purosangue_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/ferrari_purosangue_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/ferrari_purosangue_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/ferrari_purosangue_5.png', false, 5);

-- 8) Lamborghini Urus Performante
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Lamborghini','Urus Performante',2024,20000000,'Высокопроизводительный SUV Lamborghini.', 'V8 Twin-Turbo', 666, '3.3s', 'AWD', 'Orange', 4.0, 'SUV', 'Automatic', 3000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/lamborghini_urus_performante_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/lamborghini_urus_performante_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/lamborghini_urus_performante_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/lamborghini_urus_performante_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/lamborghini_urus_performante_5.png', false, 5);

-- 9) Land Rover Range Rover Sport L494
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Land Rover','Range Rover Sport L494',2021,9000000,'Премиальный внедорожник Land Rover.', 'V6 Turbo', 355, '6.4s', 'AWD', 'Green', 3.0, 'SUV', 'Automatic', 25000, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/land_rover_range_rover_sport_l494_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/land_rover_range_rover_sport_l494_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/land_rover_range_rover_sport_l494_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/land_rover_range_rover_sport_l494_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/land_rover_range_rover_sport_l494_5.png', false, 5);

-- 10) Mclaren 720S
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('McLaren','720S',2020,15000000,'McLaren 720S — суперавтомобиль.', 'V8 Twin-Turbo', 710, '2.9s', 'RWD', 'Silver', 4.0, 'Coupe', 'Automatic', 9000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mclaren_720s_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mclaren_720s_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mclaren_720s_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mclaren_720s_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mclaren_720s_5.png', false, 5);

-- 11) Mercedes G-Klass EQ Technology 580
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Mercedes-Benz','G-Klass EQ Technology 580',2023,16000000,'G-Class EQ Technology 580 — люксовый внедорожник.', 'V8 Hybrid', 600, '5.1s', 'AWD', 'Black', 4.0, 'SUV', 'Automatic', 7000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_eq_technology_580_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_eq_technology_580_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_eq_technology_580_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_eq_technology_580_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_eq_technology_580_5.png', false, 5);

-- 12) Mercedes G-Klass W463
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Mercedes-Benz','G-Klass W463',2018,8000000,'Классический G-Class W463.', 'V8', 422, '5.9s', 'AWD', 'Military Green', 4.0, 'SUV', 'Automatic', 40000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_w463_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_w463_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_w463_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_w463_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_g-klass_w463_5.png', false, 5);

-- 13) Mercedes S-Class W223
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Mercedes-Benz','S-Class W223',2022,12000000,'Флагманский седан Mercedes S-Class.', 'Inline-6 Mild-Hybrid', 375, '5.0s', 'RWD', 'Black', 3.0, 'Sedan', 'Automatic', 8000, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_s-klass_w223_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_s-klass_w223_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_s-klass_w223_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_s-klass_w223_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/mercedes-benz_s-klass_w223_5.png', false, 5);

-- 14) Porsche 911 Carrera 4 GTS
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Porsche','911 Carrera 4 GTS',2021,13000000,'Porsche 911 Carrera 4 GTS — спортивное купе.', 'Flat-6 Twin-Turbo', 480, '3.4s', 'AWD', 'Red', 3.0, 'Coupe', 'Automatic', 9000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_911_carrera_4_gts_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_911_carrera_4_gts_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_911_carrera_4_gts_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_911_carrera_4_gts_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_911_carrera_4_gts_5.png', false, 5);

-- 15) Porsche Cayenne III
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Porsche','Cayenne III',2020,8000000,'Porsche Cayenne — спортивный премиум SUV.', 'V6 Turbo', 340, '6.0s', 'AWD', 'Gray', 3.0, 'SUV', 'Automatic', 30000, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_cayenne_iii_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_cayenne_iii_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_cayenne_iii_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_cayenne_iii_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/porsche_cayenne_iii_5.png', false, 5);

-- 16) Rolls-Royce Cullinan
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Rolls-Royce','Cullinan',2021,22000000,'Роскошный внедорожник Rolls-Royce Cullinan.', 'V12 Twin-Turbo', 563, '5.2s', 'AWD', 'Pearl White', 6.75, 'SUV', 'Automatic', 7000, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/rolls-royce_cullinan_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/rolls-royce_cullinan_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/rolls-royce_cullinan_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/rolls-royce_cullinan_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/rolls-royce_cullinan_5.png', false, 5);

-- 17) Tesla Model S Plaid
INSERT INTO cars (make, model, year, price, description, engine_type, horsepower, acceleration_0_100, drive_type, color, engine_volume, body_type, transmission, mileage, stock_quantity)
VALUES ('Tesla','Model S Plaid',2022,15000000,'Электрический седан Tesla Model S Plaid.', 'Electric', 1020, '1.99s', 'AWD', 'White', NULL, 'Sedan', 'Automatic', 5000, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/tesla_model_s_plaid_1.png', true, 1);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/tesla_model_s_plaid_2.png', false, 2);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/tesla_model_s_plaid_3.png', false, 3);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/tesla_model_s_plaid_4.png', false, 4);
INSERT INTO car_photos (car_id, url, is_main, order_index) VALUES (currval(pg_get_serial_sequence('cars','id')), '/uploads/tesla_model_s_plaid_5.png', false, 5);

-- Конец файла
