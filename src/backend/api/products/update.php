
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
        // Eliminar los tamaños existentes
        $deleteQuery = "DELETE FROM product_sizes WHERE product_id = :product_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':product_id', $product_id);
        $deleteStmt->execute();
        
        // Insertar los nuevos tamaños
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
        if ($row['type'] === 'alambre') {
            $size["name"] = $sizeRow['size'];
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
?>
