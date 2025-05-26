
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
                     (product_id, size_or_name, price, shape) 
                     VALUES (:product_id, :size_or_name, :price, :shape)";
        
        $sizeStmt = $db->prepare($sizeQuery);
        $sizeStmt->bindParam(':product_id', $product_id);
        $sizeStmt->bindParam(':size_or_name', $size->size);
        $sizeStmt->bindParam(':price', $size->price);
        
        // Para la forma (solo para estribos y clavos)
        $shape = isset($size->shape) ? $size->shape : null;
        $sizeStmt->bindParam(':shape', $shape);
        
        $sizeStmt->execute();
    }
    
    // Actualizar la fecha de actualización
    $updateDateQuery = "UPDATE price_updates SET update_date = NOW() WHERE id = 1";
    $updateDateStmt = $db->prepare($updateDateQuery);
    $updateDateStmt->execute();
    
    $db->commit();
    
    // Recuperar el producto completo para devolverlo
    $product = [
        "id" => $product_id,
        "name" => $data->name,
        "type" => $data->type,
        "sizes" => []
    ];
    
    // Obtener tamaños y precios
    $sizesQuery = "SELECT ps.size_or_name as size, ps.price, ps.shape
                   FROM product_sizes ps 
                   WHERE ps.product_id = :product_id
                   ORDER BY ps.size_or_name";
    
    $sizesStmt = $db->prepare($sizesQuery);
    $sizesStmt->bindParam(':product_id', $product_id);
    $sizesStmt->execute();
    
    while ($sizeRow = $sizesStmt->fetch(PDO::FETCH_ASSOC)) {
        $size = [
            "size" => $sizeRow['size'],
            "price" => (float)$sizeRow['price']
        ];
        
        if ($sizeRow['shape']) {
            $size["shape"] = $sizeRow['shape'];
        }
        
        // Para alambres, también agregar el campo name
        if ($data->type === 'alambre') {
            $size["name"] = $sizeRow['size'];
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
