
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';
include_once '../../utils/response.php';

// Verificar que se proporcionó un ID
if (!isset($_GET['id'])) {
    sendError("ID de producto requerido", 400);
}

$product_id = $_GET['id'];
$database = new Database();
$db = $database->getConnection();

try {
    // Obtener información básica del producto
    $query = "SELECT p.id, p.name, p.type FROM products p WHERE p.id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $product_id);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        sendError("Producto no encontrado", 404);
    }
    
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $product = [
        "id" => $row['id'],
        "name" => $row['name'],
        "type" => $row['type'],
        "sizes" => []
    ];
    
    // Obtener tamaños y precios para este producto
    $sizesQuery = "SELECT ps.id, ps.size, ps.price, ps.diameter, 
                    s.name as shape, nt.name as nail_type
                   FROM product_sizes ps 
                   LEFT JOIN shapes s ON ps.shape_id = s.id
                   LEFT JOIN nail_types nt ON ps.nail_type_id = nt.id
                   WHERE ps.product_id = :product_id";
                   
    // Filtrar por diámetro si se proporciona
    if (isset($_GET['diameter'])) {
        $sizesQuery .= " AND ps.diameter = :diameter";
    }
    
    // Filtrar por tipo de clavo si se proporciona
    if (isset($_GET['nailType'])) {
        $sizesQuery .= " AND nt.id = :nail_type_id";
    }
    
    $sizesQuery .= " ORDER BY ps.size";
                   
    $sizesStmt = $db->prepare($sizesQuery);
    $sizesStmt->bindParam(':product_id', $row['id']);
    
    if (isset($_GET['diameter'])) {
        $sizesStmt->bindParam(':diameter', $_GET['diameter']);
    }
    
    if (isset($_GET['nailType'])) {
        $sizesStmt->bindParam(':nail_type_id', $_GET['nailType']);
    }
    
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
    
    // Agregar arrays de valores disponibles según el tipo de producto
    if ($product['type'] === 'construction') {
        // Obtener diámetros disponibles
        $diametersQuery = "SELECT value FROM diameters ORDER BY value";
        $diametersStmt = $db->prepare($diametersQuery);
        $diametersStmt->execute();
        
        $product['availableDiameters'] = [];
        while ($diameterRow = $diametersStmt->fetch(PDO::FETCH_ASSOC)) {
            $product['availableDiameters'][] = $diameterRow['value'];
        }
        
        // Obtener formas disponibles
        $shapesQuery = "SELECT name FROM shapes ORDER BY id";
        $shapesStmt = $db->prepare($shapesQuery);
        $shapesStmt->execute();
        
        $product['availableShapes'] = [];
        while ($shapeRow = $shapesStmt->fetch(PDO::FETCH_ASSOC)) {
            $product['availableShapes'][] = $shapeRow['name'];
        }
    } 
    else if ($product['type'] === 'hardware') {
        // Obtener tipos de clavo disponibles
        $nailTypesQuery = "SELECT id, name FROM nail_types ORDER BY id";
        $nailTypesStmt = $db->prepare($nailTypesQuery);
        $nailTypesStmt->execute();
        
        $product['availableNailTypes'] = [];
        while ($nailTypeRow = $nailTypesStmt->fetch(PDO::FETCH_ASSOC)) {
            $product['availableNailTypes'][] = $nailTypeRow['name'];
        }
    }
    
    sendResponse($product);
} catch (PDOException $e) {
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
