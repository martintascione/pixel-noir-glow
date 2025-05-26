
-- Tabla principal de productos
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('Estribos', 'Clavos', 'Alambres') NOT NULL,
  subcategory ENUM('4.2mm', '6mm') DEFAULT NULL,
  shape ENUM('Cuadrado', 'Rectangular', 'Triangular') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de tamaños y precios
CREATE TABLE IF NOT EXISTS product_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insertar productos de ejemplo
INSERT INTO products (name, category, subcategory, shape) VALUES
('Estribos Cuadrados 4.2mm', 'Estribos', '4.2mm', 'Cuadrado'),
('Estribos Rectangulares 4.2mm', 'Estribos', '4.2mm', 'Rectangular'),
('Estribos Cuadrados 6mm', 'Estribos', '6mm', 'Cuadrado'),
('Clavos Común', 'Clavos', NULL, NULL),
('Alambre Galvanizado', 'Alambres', NULL, NULL);

-- Insertar tamaños y precios
INSERT INTO product_sizes (product_id, size, price) VALUES
-- Estribos Cuadrados 4.2mm
(1, '10x10', 150.00),
(1, '15x15', 170.00),
(1, '20x20', 190.00),
-- Estribos Rectangulares 4.2mm
(2, '10x20', 180.00),
(2, '15x25', 200.00),
-- Estribos Cuadrados 6mm
(3, '10x10', 180.00),
(3, '15x15', 200.00),
(3, '20x20', 220.00),
-- Clavos
(4, '1.5 pulgadas', 80.00),
(4, '2 pulgadas', 100.00),
(4, '2.5 pulgadas', 120.00),
-- Alambres
(5, '17/15', 2000.00),
(5, '19/17', 2200.00);
