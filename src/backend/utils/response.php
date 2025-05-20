
<?php
/**
 * Envía una respuesta JSON exitosa
 * 
 * @param mixed $data Los datos a enviar como JSON
 * @param int $statusCode El código HTTP de la respuesta
 */
function sendResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Envía una respuesta de error JSON
 * 
 * @param string $message El mensaje de error
 * @param int $statusCode El código HTTP de error
 */
function sendError($message, $statusCode = 400) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode(["error" => $message]);
    exit;
}
?>
