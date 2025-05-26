
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/database.php';
include_once '../../utils/response.php';

// Leer los datos enviados
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || !isset($data->type) || !isset($data->sizes) || empty($data->sizes)) {
    sendError("Datos incompletos. Se requiere nombre, tipo y al menos un tamaño/precio.");
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // Insertar el producto
    $query = "INSERT INTO products (name, type) VALUES (:name, :type)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':type', $data->type);
    $stmt->execute();
    
    $product_id = $db->lastInsertId();
    
    // Insertar los tamaños
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
    $updateDateQuery = "UPDATE price_updates SET update_date = NOW() WHERE id = (SELECT id FROM price_updates ORDER BY id LIMIT 1)";
    $updateDateStmt = $db->prepare($updateDateQuery);
    $updateDateStmt->execute();
    
    // Si no hay registro, crear uno
    if ($updateDateStmt->rowCount() == 0) {
        $createDateQuery = "INSERT INTO price_updates (update_date) VALUES (NOW())";
        $createDateStmt = $db->prepare($createDateQuery);
        $createDateStmt->execute();
    }
    
    $db->commit();
    
    // Recuperar el producto completo para devolverlo
    $product = [
        "id" => $product_id,
        "name" => $data->name,
        "type" => $data->type,
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
    
    sendResponse($product, 201);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
