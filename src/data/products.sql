
-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de diámetros disponibles
CREATE TABLE IF NOT EXISTS diameters (
  id SERIAL PRIMARY KEY,
  value VARCHAR(10) NOT NULL,
  label VARCHAR(20) NOT NULL
);

-- Tabla de formas para estribos
CREATE TABLE IF NOT EXISTS shapes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Tabla de tipos de clavos
CREATE TABLE IF NOT EXISTS nail_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Tabla de tamaños y precios para productos
CREATE TABLE IF NOT EXISTS product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  diameter VARCHAR(10) DEFAULT NULL,
  size VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  shape_id INTEGER REFERENCES shapes(id) DEFAULT NULL,
  nail_type_id INTEGER REFERENCES nail_types(id) DEFAULT NULL
);

-- Fecha de última actualización general (para mostrar en la interfaz)
CREATE TABLE IF NOT EXISTS price_updates (
  id SERIAL PRIMARY KEY,
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
(1, 'Estribos', 'construccion'),
(2, 'Clavos', 'ferreteria'),
(3, 'Alambres', 'construccion'),
(4, 'Torniquetes', 'alambrado'),
(5, 'Tranquerones', 'alambrado');

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

-- Función para actualizar la fecha en price_updates
CREATE OR REPLACE FUNCTION update_price_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar la fecha en la tabla de actualizaciones
  UPDATE price_updates SET update_date = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar la fecha cuando se modifican los precios
CREATE TRIGGER update_price_date_trigger
AFTER INSERT OR UPDATE ON product_sizes
FOR EACH STATEMENT
EXECUTE FUNCTION update_price_date();

-- Para actualizar manualmente la fecha de precios:
-- UPDATE price_updates SET update_date = CURRENT_TIMESTAMP;

-- Consulta para obtener estribos con su forma
-- SELECT ps.id, p.name, ps.diameter, ps.size, ps.price, s.name as shape
-- FROM product_sizes ps
-- JOIN products p ON ps.product_id = p.id
-- JOIN shapes s ON ps.shape_id = s.id
-- WHERE p.id = 1
-- ORDER BY ps.diameter, s.id, ps.size;

-- Consulta para obtener clavos con su tipo
-- SELECT ps.id, p.name, ps.size, ps.price, nt.name as nail_type
-- FROM product_sizes ps
-- JOIN products p ON ps.product_id = p.id
-- JOIN nail_types nt ON ps.nail_type_id = nt.id
-- WHERE p.id = 2
-- ORDER BY nt.id, ps.size;

-- Para consultar la fecha de última actualización:
-- SELECT update_date FROM price_updates LIMIT 1;
