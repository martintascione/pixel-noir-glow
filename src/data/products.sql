
-- Eliminar tablas existentes para empezar limpio
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS price_updates;
DROP TABLE IF EXISTS products;

-- Tabla de productos simplificada
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('estribos', 'clavos', 'alambre') NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de tamaños y precios simplificada
CREATE TABLE IF NOT EXISTS product_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  size_or_name VARCHAR(100) NOT NULL, -- Para medida libre o nombre del alambre
  price DECIMAL(10, 2) NOT NULL,
  shape VARCHAR(50) DEFAULT NULL, -- Para forma de estribos o clavos
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Fecha de última actualización
CREATE TABLE IF NOT EXISTS price_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar fecha de actualización inicial
INSERT INTO price_updates (update_date) VALUES (CURRENT_TIMESTAMP);

-- Insertar productos base
INSERT INTO products (id, name, type) VALUES
(1, 'Estribos', 'estribos'),
(2, 'Clavos', 'clavos'),
(3, 'Alambres', 'alambre');

-- Datos de ejemplo para Estribos
INSERT INTO product_sizes (product_id, size_or_name, price, shape) VALUES
(1, '10x10', 150, 'cuadrada'),
(1, '15x15', 170, 'cuadrada'),
(1, '20x20', 190, 'cuadrada'),
(1, '10x20', 180, 'rectangular'),
(1, '15x25', 200, 'rectangular'),
(1, '10x10x10', 160, 'triangular'),
(1, '15x15x15', 180, 'triangular');

-- Datos de ejemplo para Clavos
INSERT INTO product_sizes (product_id, size_or_name, price, shape) VALUES
(2, '1.5 pulgadas', 80, 'Punta París'),
(2, '2 pulgadas', 100, 'Punta París'),
(2, '2.5 pulgadas', 120, 'Punta París'),
(2, '3 pulgadas', 130, 'Clavo de Techo'),
(2, '4 pulgadas', 150, 'Clavo de Techo');

-- Datos de ejemplo para Alambres
INSERT INTO product_sizes (product_id, size_or_name, price) VALUES
(3, 'Alambre 17/15 Acindar', 2000),
(3, 'Alambre 19/17 Corralero', 2200),
(3, 'Alta resistencia Bragado', 2400),
(3, 'Bagual clásico', 2300),
(3, 'Bagual super', 2500);

-- Trigger para actualizar fecha
DELIMITER //
CREATE TRIGGER update_price_date
AFTER INSERT ON product_sizes
FOR EACH ROW
BEGIN
  UPDATE price_updates SET update_date = NOW() WHERE id = 1;
END//

CREATE TRIGGER update_price_date_on_update
AFTER UPDATE ON product_sizes
FOR EACH ROW
BEGIN
  UPDATE price_updates SET update_date = NOW() WHERE id = 1;
END//
DELIMITER ;
