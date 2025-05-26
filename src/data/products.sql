
-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de diámetros disponibles
CREATE TABLE IF NOT EXISTS diameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  value VARCHAR(10) NOT NULL,
  label VARCHAR(20) NOT NULL
);

-- Tabla de formas para estribos
CREATE TABLE IF NOT EXISTS shapes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Tabla de tipos de clavos
CREATE TABLE IF NOT EXISTS nail_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Tabla de tamaños y precios para productos
CREATE TABLE IF NOT EXISTS product_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  diameter VARCHAR(10) DEFAULT NULL,
  size VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  shape_id INT DEFAULT NULL,
  nail_type_id INT DEFAULT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE SET NULL,
  FOREIGN KEY (nail_type_id) REFERENCES nail_types(id) ON DELETE SET NULL
);

-- Fecha de última actualización general (para mostrar en la interfaz)
CREATE TABLE IF NOT EXISTS price_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar fecha de actualización inicial
INSERT INTO price_updates (update_date) VALUES (CURRENT_TIMESTAMP);

-- Insertar diámetros disponibles
INSERT INTO diameters (value, label) VALUES
('4.2', '4.2 mm'),
('6', '6 mm');

-- Insertar formas para estribos
INSERT INTO shapes (id, name) VALUES
(1, 'Cuadrado'),
(2, 'Rectangular'),
(3, 'Triangular');

-- Insertar tipos de clavos
INSERT INTO nail_types (id, name) VALUES
(1, 'Punta París'),
(2, 'De Techo');

-- Insertar productos
INSERT INTO products (id, name, type) VALUES
(1, 'Estribos', 'construction'),
(2, 'Clavos', 'hardware'),
(3, 'Alambres', 'wire'),
(4, 'Torniquetes', 'fencing'),
(5, 'Tranquerones', 'fencing');

-- Insertar tamaños y precios para Estribos
-- Estribos 4.2mm Cuadrados
INSERT INTO product_sizes (product_id, diameter, size, price, shape_id) VALUES
(1, '4.2', '10x10', 150, 1),
(1, '4.2', '15x15', 170, 1),
(1, '4.2', '20x20', 190, 1);

-- Estribos 4.2mm Rectangulares
INSERT INTO product_sizes (product_id, diameter, size, price, shape_id) VALUES
(1, '4.2', '10x20', 180, 2),
(1, '4.2', '15x25', 200, 2);

-- Estribos 4.2mm Triangulares
INSERT INTO product_sizes (product_id, diameter, size, price, shape_id) VALUES
(1, '4.2', '10x10x10', 160, 3),
(1, '4.2', '15x15x15', 180, 3);

-- Estribos 6mm Cuadrados
INSERT INTO product_sizes (product_id, diameter, size, price, shape_id) VALUES
(1, '6', '10x10', 180, 1),
(1, '6', '15x15', 200, 1),
(1, '6', '20x20', 220, 1);

-- Estribos 6mm Rectangulares
INSERT INTO product_sizes (product_id, diameter, size, price, shape_id) VALUES
(1, '6', '20x30', 230, 2),
(1, '6', '30x40', 250, 2);

-- Estribos 6mm Triangulares
INSERT INTO product_sizes (product_id, diameter, size, price, shape_id) VALUES
(1, '6', '10x10x10', 190, 3),
(1, '6', '15x15x15', 210, 3),
(1, '6', '20x20x20', 230, 3);

-- Insertar tamaños y precios para Clavos
-- Clavos Punta París
INSERT INTO product_sizes (product_id, size, price, nail_type_id) VALUES
(2, '1.5 pulgadas', 80, 1),
(2, '2 pulgadas', 100, 1),
(2, '2.5 pulgadas', 120, 1);

-- Clavos de Techo
INSERT INTO product_sizes (product_id, size, price, nail_type_id) VALUES
(2, '3 pulgadas', 130, 2),
(2, '4 pulgadas', 150, 2);

-- Insertar tamaños y precios para Alambres
INSERT INTO product_sizes (product_id, size, price) VALUES
(3, 'Alambre 17/15 Acindar', 2000),
(3, 'Alambre 19/17 Corralero', 2200),
(3, 'Alta resistencia Bragado', 2400),
(3, 'Bagual clásico', 2300),
(3, 'Bagual super', 2500),
(3, 'Bollero Acindar', 2100),
(3, 'Bollero Bragado', 2050),
(3, 'Mini Bagual', 1900),
(3, 'Mediana resistencia Acindar', 1800),
(3, 'Mediana resistencia Bragado', 1750);

-- Insertar tamaños y precios para Torniquetes
INSERT INTO product_sizes (product_id, size, price) VALUES
(4, 'Doble liviana', 300),
(4, 'Doble reforzada', 350),
(4, 'N° 3 zincada', 250),
(4, 'N° 6 verde', 270),
(4, 'N° 7 zincada', 280),
(4, 'N° 8 verde', 290);

-- Insertar tamaños y precios para Tranquerones
INSERT INTO product_sizes (product_id, size, price) VALUES
(5, 'Barral tranquerón (solo)', 400),
(5, 'Contratranquerón de 1,2 (solo)', 350),
(5, 'Crique (solo)', 300),
(5, 'Tranquerón crique 1,2 (completo)', 800),
(5, 'Tranquerón placa 1,2', 750);

-- Crear trigger para actualizar fecha
DELIMITER //
CREATE TRIGGER update_price_date
AFTER INSERT ON product_sizes
FOR EACH ROW
BEGIN
  UPDATE price_updates SET update_date = NOW() WHERE id = (SELECT id FROM (SELECT id FROM price_updates LIMIT 1) AS p);
END//

CREATE TRIGGER update_price_date_on_update
AFTER UPDATE ON product_sizes
FOR EACH ROW
BEGIN
  UPDATE price_updates SET update_date = NOW() WHERE id = (SELECT id FROM (SELECT id FROM price_updates LIMIT 1) AS p);
END//
DELIMITER ;
