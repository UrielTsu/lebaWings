<?php
declare(strict_types=1);

/**
 * ================================================================
 * LEBA WINGS - REST API ENTRY POINT
 * ================================================================
 */

// Headers CORS para React Native & Web Dashboard
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoloader PSR-4 simplificado sin dependencias externas
spl_autoload_register(function ($class) {
    $prefix = 'LebaWings\\';
    $baseDir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // Manejar subcarpeta Config
    if (str_starts_with($relativeClass, 'Config\\')) {
        $file = __DIR__ . '/../config/' . substr($relativeClass, 7) . '.php';
    }

    if (file_exists($file)) {
        require_once $file;
    }
});

use LebaWings\Controllers\MenuController;
use LebaWings\Controllers\OrderController;

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalizar URI eliminando trailing slashes
$uri = rtrim($uri, '/');
if (empty($uri)) {
    $uri = '/';
}

// Router sencillo y de alto rendimiento
try {
    // 1. Health check
    if ($uri === '' || $uri === '/api' || $uri === '/api/health') {
        echo json_encode([
            'system' => 'Leba Wings API',
            'version' => '1.0.0',
            'status' => 'operational',
            'time' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    // 2. Menú & Disponibilidad
    if ($uri === '/api/menu' && $method === 'GET') {
        (new MenuController())->index();
    }

    if (preg_match('#^/api/menu/(\d+)/toggle-stock$#', $uri, $matches) && ($method === 'PATCH' || $method === 'POST')) {
        (new MenuController())->toggleStock((int)$matches[1]);
    }

    if (preg_match('#^/api/menu/(\d+)/weight$#', $uri, $matches) && ($method === 'PATCH' || $method === 'POST')) {
        (new MenuController())->updateWeight((int)$matches[1]);
    }

    // 3. Comandas & Cola KDS
    if ($uri === '/api/orders' && $method === 'POST') {
        (new OrderController())->store();
    }

    if ($uri === '/api/orders/kitchen-queue' && $method === 'GET') {
        (new OrderController())->kitchenQueue();
    }

    if (preg_match('#^/api/orders/(\d+)/status$#', $uri, $matches) && ($method === 'PATCH' || $method === 'POST')) {
        (new OrderController())->updateStatus((int)$matches[1]);
    }

    // Si ninguna ruta coincide
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => "Ruta no encontrada: [{$method}] {$uri}"
    ], JSON_UNESCAPED_UNICODE);

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
