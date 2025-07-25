
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Consulta para obtener productos
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
        
        // Obtener tamaños/items para cada producto
        $sizesQuery = "SELECT ps.size_or_name as size, ps.price, ps.shape
                       FROM product_sizes ps 
                       WHERE ps.product_id = :product_id
                       ORDER BY ps.size_or_name";
                       
        $sizesStmt = $db->prepare($sizesQuery);
        $sizesStmt->bindParam(':product_id', $row['id']);
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
        
        $products[] = $product;
    }
    
    sendResponse($products);
} catch (PDOException $e) {
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
