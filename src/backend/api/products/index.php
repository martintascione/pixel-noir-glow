
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
