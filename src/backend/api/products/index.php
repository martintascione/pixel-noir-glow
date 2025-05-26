
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Consulta para obtener productos con sus tamaños
    $query = "SELECT p.id, p.name, p.category, p.subcategory, p.shape 
              FROM products p 
              ORDER BY p.category, p.subcategory, p.shape, p.name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $products = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $product = [
            "id" => $row['id'],
            "name" => $row['name'],
            "category" => $row['category'],
            "subcategory" => $row['subcategory'],
            "shape" => $row['shape'],
            "sizes" => []
        ];
        
        // Obtener tamaños para este producto
        $sizesQuery = "SELECT size, price FROM product_sizes 
                       WHERE product_id = :product_id 
                       ORDER BY size";
        $sizesStmt = $db->prepare($sizesQuery);
        $sizesStmt->bindParam(':product_id', $row['id']);
        $sizesStmt->execute();
        
        while ($sizeRow = $sizesStmt->fetch(PDO::FETCH_ASSOC)) {
            $product["sizes"][] = [
                "size" => $sizeRow['size'],
                "price" => (float)$sizeRow['price']
            ];
        }
        
        $products[] = $product;
    }
    
    sendResponse($products);
} catch (PDOException $e) {
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
