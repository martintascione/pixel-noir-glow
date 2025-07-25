
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar solicitudes OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../config/database.php';
include_once '../../utils/response.php';

// Leer los datos enviados
$data = json_decode(file_get_contents("php://input"));

// Verificar ID del producto
$product_id = isset($_GET['id']) ? $_GET['id'] : 
             (isset($data->id) ? $data->id : null);

if (!$product_id) {
    sendError("ID de producto requerido");
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Debug: Imprime los datos recibidos
    error_log("Datos recibidos para actualizar: " . file_get_contents("php://input"));
    error_log("ID del producto a actualizar: " . $product_id);
    
    // Verificar si el producto existe
    $checkQuery = "SELECT id FROM products WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $product_id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() == 0) {
        sendError("Producto no encontrado", 404);
    }
    
    // Actualizar datos básicos del producto si se proporcionan
    if (isset($data->name) || isset($data->type)) {
        $updateFields = [];
        $params = [];
        
        if (isset($data->name)) {
            $updateFields[] = "name = :name";
            $params[':name'] = $data->name;
        }
        
        if (isset($data->type)) {
            $updateFields[] = "type = :type";
            $params[':type'] = $data->type;
        }
        
        if (!empty($updateFields)) {
            $query = "UPDATE products SET " . implode(", ", $updateFields) . " WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $product_id);
            
            foreach ($params as $param => $value) {
                $stmt->bindParam($param, $value);
            }
            
            $stmt->execute();
        }
    }
    
    // Actualizar o agregar tamaños si se proporcionan
    if (isset($data->sizes) && is_array($data->sizes)) {
        // Si se proporcionan tamaños, eliminar los existentes
        $deleteQuery = "DELETE FROM product_sizes WHERE product_id = :product_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':product_id', $product_id);
        $deleteStmt->execute();
        
        // Insertar los nuevos tamaños
        foreach ($data->sizes as $size) {
            $sizeQuery = "INSERT INTO product_sizes 
                         (product_id, size, price, diameter, shape_id, nail_type_id) 
                         VALUES (:product_id, :size, :price, :diameter, :shape_id, :nail_type_id)";
            
            $sizeStmt = $db->prepare($sizeQuery);
            $sizeStmt->bindParam(':product_id', $product_id);
            $sizeStmt->bindParam(':size', $size->size);
            $sizeStmt->bindParam(':price', $size->price);
            
            // Valores opcionales
            $diameter = isset($size->diameter) ? $size->diameter : null;
            $sizeStmt->bindParam(':diameter', $diameter);
            
            // Para la forma, obtenemos el ID si existe
            $shape_id = null;
            if (isset($size->shape)) {
                $shapeQuery = "SELECT id FROM shapes WHERE name = :shape";
                $shapeStmt = $db->prepare($shapeQuery);
                $shapeStmt->bindParam(':shape', $size->shape);
                $shapeStmt->execute();
                
                if ($shapeRow = $shapeStmt->fetch(PDO::FETCH_ASSOC)) {
                    $shape_id = $shapeRow['id'];
                } else {
                    // Insertar nueva forma si no existe
                    $newShapeQuery = "INSERT INTO shapes (name) VALUES (:name)";
                    $newShapeStmt = $db->prepare($newShapeQuery);
                    $newShapeStmt->bindParam(':name', $size->shape);
                    $newShapeStmt->execute();
                    $shape_id = $db->lastInsertId();
                }
            }
            $sizeStmt->bindParam(':shape_id', $shape_id);
            
            // Para el tipo de clavo, obtenemos el ID si existe
            $nail_type_id = null;
            if (isset($size->nailType)) {
                $nailTypeQuery = "SELECT id FROM nail_types WHERE name = :nail_type";
                $nailTypeStmt = $db->prepare($nailTypeQuery);
                $nailTypeStmt->bindParam(':nail_type', $size->nailType);
                $nailTypeStmt->execute();
                
                if ($nailTypeRow = $nailTypeStmt->fetch(PDO::FETCH_ASSOC)) {
                    $nail_type_id = $nailTypeRow['id'];
                } else {
                    // Insertar nuevo tipo de clavo si no existe
                    $newNailTypeQuery = "INSERT INTO nail_types (name) VALUES (:name)";
                    $newNailTypeStmt = $db->prepare($newNailTypeQuery);
                    $newNailTypeStmt->bindParam(':name', $size->nailType);
                    $newNailTypeStmt->execute();
                    $nail_type_id = $db->lastInsertId();
                }
            }
            $sizeStmt->bindParam(':nail_type_id', $nail_type_id);
            
            $sizeStmt->execute();
        }
        
        // Actualizar la fecha de actualización
        $updateDateQuery = "UPDATE price_updates SET update_date = NOW() WHERE id = (SELECT id FROM (SELECT id FROM price_updates ORDER BY id DESC LIMIT 1) AS p)";
        $updateDateStmt = $db->prepare($updateDateQuery);
        $updateDateStmt->execute();
        
        // Si no hay registro de actualización, crear uno nuevo
        if ($updateDateStmt->rowCount() == 0) {
            $createDateQuery = "INSERT INTO price_updates (update_date) VALUES (NOW())";
            $createDateStmt = $db->prepare($createDateQuery);
            $createDateStmt->execute();
        }
    }
    
    $db->commit();
    
    // Recuperar el producto actualizado para devolverlo
    $query = "SELECT id, name, type FROM products WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $product_id);
    $stmt->execute();
    
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $product = [
        "id" => $row['id'],
        "name" => $row['name'],
        "type" => $row['type'],
        "sizes" => []
    ];
    
    // Obtener tamaños y precios
    $sizesQuery = "SELECT ps.id, ps.size, ps.price, ps.diameter, 
                   s.name as shape, nt.name as nail_type
                   FROM product_sizes ps 
                   LEFT JOIN shapes s ON ps.shape_id = s.id
                   LEFT JOIN nail_types nt ON ps.nail_type_id = nt.id
                   WHERE ps.product_id = :product_id
                   ORDER BY ps.size";
    
    $sizesStmt = $db->prepare($sizesQuery);
    $sizesStmt->bindParam(':product_id', $product_id);
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
    
    sendResponse($product);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
