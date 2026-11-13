<?php
declare(strict_types=1);

namespace LebaWings\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $driver = getenv('DB_DRIVER') ?: 'mysql'; // <-- Aquí se define el driver
            $host = getenv('DB_HOST') ?: (getenv('MYSQLHOST') ?: 'switchyard.proxy.rlwy.net');
            $port = getenv('DB_PORT') ?: (getenv('MYSQLPORT') ?: '49185');
            $db   = getenv('DB_NAME') ?: (getenv('MYSQLDATABASE') ?: 'railway'); // <-- Corregido a MYSQLDATABASE
            $user = getenv('DB_USER') ?: (getenv('MYSQLUSER') ?: 'root');
            $pass = getenv('DB_PASS') ?: (getenv('MYSQLPASSWORD') ?: 'algCsKyccJYtQbvvEXIjRdIuEOdJRAUQ');
            $charset = 'utf8mb4';

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                if ($driver === 'sqlite') {
                    $sqlitePath = getenv('DB_SQLITE_PATH') ?: __DIR__ . '/../database/database.sqlite';
                    self::$instance = new PDO("sqlite:" . $sqlitePath, null, null, $options);
                } else {
                    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";
                    self::$instance = new PDO($dsn, $user, $pass, $options);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Database connection failed: ' . $e->getMessage()
                ]);
                exit;
            }
        }

        return self::$instance;
    }
}