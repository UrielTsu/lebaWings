<?php
declare(strict_types=1);

namespace LebaWings\Controllers;

use LebaWings\Models\MenuItem;
use Exception;

class MenuController {
    private MenuItem $menuModel;

    public function __construct() {
        $this->menuModel = new MenuItem();
    }

    /**
     * GET /api/menu
     * Parámetros: ?only_available=true/false&category_id=X
     */
    public function index(): void {
        $onlyAvailable = filter_var($_GET['only_available'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;

        $items = $this->menuModel->getAll($onlyAvailable, $categoryId);

        $this->jsonResponse([
            'success' => true,
            'count' => count($items),
            'data' => $items
        ]);
    }

    /**
     * PATCH /api/menu/{id}/toggle-stock
     * Alternar disponibilidad booleana (Disponible / Agotado)
     */
    public function toggleStock(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $explicitStatus = isset($input['is_available']) ? (bool)$input['is_available'] : null;

        $item = $this->menuModel->findById($id);
        if (!$item) {
            $this->jsonResponse(['success' => false, 'error' => 'Producto no encontrado'], 404);
            return;
        }

        $this->menuModel->toggleAvailability($id, $explicitStatus);
        $updated = $this->menuModel->findById($id);

        $this->jsonResponse([
            'success' => true,
            'message' => 'Disponibilidad actualizada exitosamente',
            'data' => [
                'id' => (int)$updated['id'],
                'name' => $updated['name'],
                'is_available' => (bool)$updated['is_available']
            ]
        ]);
    }

    /**
     * PATCH /api/menu/{id}/weight
     * Configuración del peso manual de cocina (1, 2, 3)
     */
    public function updateWeight(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $weight = (int)($input['prep_weight'] ?? 0);

        if ($weight < 1 || $weight > 3) {
            $this->jsonResponse([
                'success' => false,
                'error' => 'El peso debe ser 1 (Rápido), 2 (Medio) o 3 (Complejo)'
            ], 422);
            return;
        }

        try {
            $this->menuModel->updatePrepWeight($id, $weight);
            $this->jsonResponse([
                'success' => true,
                'message' => "Peso de preparación asignado a {$weight}",
                'data' => ['id' => $id, 'prep_weight' => $weight]
            ]);
        } catch (Exception $e) {
            $this->jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    private function jsonResponse(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}
