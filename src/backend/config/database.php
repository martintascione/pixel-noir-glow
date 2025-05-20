
<?php
class Database {
    // Modifica estas credenciales según tu configuración local
    private $host = "localhost";
    private $db_name = "hierrotascione";
    private $username = "root"; // Cambia esto a tu usuario de MySQL local
    private $password = ""; // Cambia esto a tu contraseña de MySQL local
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET NAMES 'utf8'");
        } catch(PDOException $e) {
            echo "Error de conexión: " . $e->getMessage();
        }

        return $this->conn;
    }
}
?>
