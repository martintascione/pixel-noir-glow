
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Consulta para obtener la fecha de última actualización
    $query = "SELECT update_date FROM price_updates ORDER BY id DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $date = [
            "updateDate" => $row['update_date']
        ];
        sendResponse($date);
    } else {
        // Si no hay registro, enviar la fecha actual
        $date = [
            "updateDate" => date('Y-m-d H:i:s')
        ];
        sendResponse($date);
    }
} catch (PDOException $e) {
    sendError("Error en la base de datos: " . $e->getMessage(), 500);
}
?>
