<?php
declare(strict_types=1);

namespace LebaWings\Controllers;

use LebaWings\Models\Order;
use LebaWings\Services\PriorityQueueService;
use Exception;

class OrderController {
    private Order $orderModel;

    public function __construct() {
        $this->orderModel = new Order();
    }

    /**
     * POST /api/orders
     * Entrada segura desde la app de Meseros (React Native).
     * Payload esperado:
     * {
     *   "table_number": "Mesa 4",
     *   "waiter_name": "Carlos M.",
     *   "notes": "Alitas extra crujientes",
     *   "items": [
     *      {"menu_item_id": 1, "quantity": 2, "sauce_or_notes": "Mango Habanero"},
     *      {"menu_item_id": 5, "quantity": 1, "sauce_or_notes": "Bien frías"}
     *   ]
     * }
     */
    public function store(): void {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            $this->jsonResponse(['success' => false, 'error' => 'Cuerpo JSON inválido o vacío'], 400);
            return;
        }

        $tableNumber = trim($input['table_number'] ?? '');
        $waiterName  = trim($input['waiter_name'] ?? '');
        $items       = $input['items'] ?? [];
        $notes       = $input['notes'] ?? null;

        if (empty($tableNumber)) {
            $this->jsonResponse(['success' => false, 'error' => 'El número de mesa es obligatorio'], 422);
            return;
        }

        if (empty($waiterName)) {
            $this->jsonResponse(['success' => false, 'error' => 'El nombre del mesero es obligatorio'], 422);
            return;
        }

        if (!is_array($items) || empty($items)) {
            $this->jsonResponse(['success' => false, 'error' => 'Debe incluir al menos un producto'], 422);
            return;
        }

        try {
            $result = $this->orderModel->createOrder($tableNumber, $waiterName, $items, $notes);
            $this->jsonResponse([
                'success' => true,
                'message' => 'Comanda enviada a cocina con éxito',
                'data' => $result
            ], 201);
        } catch (Exception $e) {
            $this->jsonResponse([
                'success' => false,
                'error' => $e->getMessage()
            ], 409); // Conflicto (p.ej. item agotado concurrentemente)
        }
    }

    /**
     * GET /api/orders/kitchen-queue
     * Endpoint consumido por la pantalla KDS de Cocina en React.
     * Devuelve las órdenes activas ordenadas por el algoritmo de cuello de botella (Priority Score).
     */
    public function kitchenQueue(): void {
        $orders = $this->orderModel->getActiveKitchenOrders();

        // Aplicar motor de cola de prioridad (pesos + tiempo transcurrido)
        PriorityQueueService::sortQueue($orders);

        $this->jsonResponse([
            'success' => true,
            'timestamp' => time(),
            'active_orders_count' => count($orders),
            'data' => $orders
        ]);
    }

    /**
     * PATCH /api/orders/{id}/status
     * Actualiza estado de preparación en cocina.
     */
    public function updateStatus(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $newStatus = trim($input['status'] ?? '');

        try {
            $this->orderModel->updateStatus($id, $newStatus);
            $this->jsonResponse([
                'success' => true,
                'message' => "Estado de orden #{$id} actualizado a '{$newStatus}'",
                'data' => ['order_id' => $id, 'status' => $newStatus]
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
