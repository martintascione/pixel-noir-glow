
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/database.php';
include_once '../../utils/response.php';

// Verificar ID del producto
$product_id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$product_id) {
    sendError("ID de producto requerido");
}

$database = new Database();
$db = $database->getConnection();

try {
    // Verificar si el producto existe
    $checkQuery = "SELECT id FROM products WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $product_id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() == 0) {
        sendError("Producto no encontrado", 404);
    }
    
    // Eliminar el producto (la restricción de clave foránea eliminará también los tamaños)
    $query = "DELETE FROM products WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $product_id);
    $stmt->execute();
    
    sendResponse(["success" => true, "message" => "Producto eliminado"]);
} catch (PDOException $e) {
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
