
# Configuración del Backend para Base de Datos

Este documento explica cómo configurar el backend para conectar la aplicación React con una base de datos PostgreSQL.

## Estructura de Archivos

Para integrar una base de datos con esta aplicación, necesitarás crear los siguientes archivos en tu servidor:

```
backend/
├── config/
│   └── database.php  (configuración de conexión a la BD)
├── api/
│   ├── products/
│   │   ├── index.php (GET todos los productos)
│   │   ├── create.php (POST crear producto)
│   │   ├── read.php (GET un producto)
│   │   ├── update.php (PUT actualizar producto)
│   │   └── delete.php (DELETE eliminar producto)
│   └── price-update/
│       └── index.php (GET fecha de actualización)
└── utils/
    └── response.php (formateo de respuestas)
```

## Configuración

1. Crea una base de datos PostgreSQL utilizando el esquema en `src/data/products.sql`
2. Configura los parámetros de conexión en `config/database.php`
3. Aloja los archivos PHP en un servidor compatible (Apache, Nginx, etc.)
4. Configura la variable de entorno `VITE_API_URL` en tu proyecto para que apunte a la URL de tu API

## Ejemplo de Implementación

### database.php
```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "hierros_tascione";
    private $username = "username";
    private $password = "password";
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "pgsql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET NAMES 'utf8'");
        } catch(PDOException $e) {
            echo "Error de conexión: " . $e->getMessage();
        }

        return $this->conn;
    }
}
?>
```

### response.php
```php
<?php
function sendResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function sendError($message, $statusCode = 400) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode(["error" => $message]);
    exit;
}
?>
```

### api/products/index.php (GET todos los productos)
```php
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Consulta base para obtener productos
    $query = "SELECT p.id, p.name, p.type FROM products p ORDER BY p.name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $products = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $product = [
            "id" => $row['id'],
            "name" => $row['name'],
            "type" => $row['type'],
            "sizes" => []
        ];
        
        // Consulta para obtener los tamaños de cada producto
        $sizesQuery = "SELECT ps.id, ps.size, ps.price, ps.diameter, 
                        s.name as shape, nt.name as nail_type
                       FROM product_sizes ps 
                       LEFT JOIN shapes s ON ps.shape_id = s.id
                       LEFT JOIN nail_types nt ON ps.nail_type_id = nt.id
                       WHERE ps.product_id = :product_id
                       ORDER BY ps.size";
                       
        $sizesStmt = $db->prepare($sizesQuery);
        $sizesStmt->bindParam(':product_id', $row['id']);
        $sizesStmt->execute();
        
        while ($sizeRow = $sizesStmt->fetch(PDO::FETCH_ASSOC)) {
            $size = [
                "size" => $sizeRow['size'],
                "price" => (float)$sizeRow['price']
            ];
            
            if ($sizeRow['diameter']) {
                $size["diameter"] = $sizeRow['diameter'];
            }
            
            if ($sizeRow['shape']) {
                $size["shape"] = $sizeRow['shape'];
            }
            
            if ($sizeRow['nail_type']) {
                $size["nailType"] = $sizeRow['nail_type'];
            }
            
            $product["sizes"][] = $size;
        }
        
        $products[] = $product;
    }
    
    sendResponse($products);
} catch (PDOException $e) {
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
```

## Implementación Completa

Para una implementación completa de todos los endpoints de la API, deberías crear archivos similares para:

1. `api/products/create.php` (POST)
2. `api/products/read.php` (GET por ID)
3. `api/products/update.php` (PUT)
4. `api/products/delete.php` (DELETE)
5. `api/price-update/index.php` (GET fecha de actualización)

Cada uno de estos archivos debe:
1. Conectar a la base de datos
2. Validar los datos de entrada
3. Ejecutar las consultas SQL apropiadas
4. Devolver una respuesta en formato JSON

## Configuración en el Front-end

Una vez que tengas tu API funcionando, configura la variable de entorno en un archivo `.env` en la raíz del proyecto:

```
VITE_API_URL=https://tu-dominio.com/api
```

Esto permitirá que la aplicación React se conecte correctamente a tu backend.
