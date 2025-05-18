
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

-- Tabla de tamaños y precios para productos
CREATE TABLE IF NOT EXISTS product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  diameter VARCHAR(10) NOT NULL,
  size VARCHAR(20) NOT NULL,
  price DECIMAL(10, 2) NOT NULL
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

-- Insertar productos
INSERT INTO products (id, name, type) VALUES
(1, 'Estribos', 'construccion'),
(2, 'Clavos', 'ferreteria'),
(3, 'Alambre', 'construccion'),
(4, 'Mallas', 'construccion');

-- Insertar tamaños y precios para Estribos
-- Estribos 4.2mm
INSERT INTO product_sizes (product_id, diameter, size, price) VALUES
(1, '4.2', '10x10', 150),
(1, '4.2', '15x15', 170),
(1, '4.2', '20x20', 190),
(1, '4.2', '10x20', 180);

-- Estribos 6mm
INSERT INTO product_sizes (product_id, diameter, size, price) VALUES
(1, '6', '10x10', 180),
(1, '6', '15x15', 200),
(1, '6', '20x20', 220),
(1, '6', '20x30', 230),
(1, '6', '30x30', 240);

-- Insertar tamaños y precios para Clavos
INSERT INTO product_sizes (product_id, diameter, size, price) VALUES
(2, '2', '1 pulgada', 80),
(2, '2', '2 pulgadas', 100),
(2, '2', '3 pulgadas', 120),
(2, '3', '2 pulgadas', 110),
(2, '3', '3 pulgadas', 130);

-- Insertar tamaños y precios para Alambre
INSERT INTO product_sizes (product_id, diameter, size, price) VALUES
(3, '1', '10 metros', 200),
(3, '1.5', '10 metros', 250),
(3, '2', '10 metros', 300);

-- Insertar tamaños y precios para Mallas
INSERT INTO product_sizes (product_id, diameter, size, price) VALUES
(4, '2', '1x1 metro', 500),
(4, '2', '1.5x1.5 metros', 750),
(4, '2', '2x2 metros', 1000),
(4, '3', '1x1 metro', 550),
(4, '3', '2x2 metros', 1100);

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

-- Para consultar todos los productos con sus tamaños, precios y diámetros:
-- SELECT p.id, p.name, ps.diameter, ps.size, ps.price
-- FROM products p
-- JOIN product_sizes ps ON p.id = ps.product_id
-- ORDER BY p.id, ps.diameter, ps.size;

-- Para consultar la fecha de última actualización:
-- SELECT update_date FROM price_updates LIMIT 1;
