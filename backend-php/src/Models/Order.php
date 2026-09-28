<?php
declare(strict_types=1);

namespace LebaWings\Models;

use PDO;
use Exception;
use LebaWings\Config\Database;

class Order {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Toma de pedido segura por parte del mesero.
     * Valida inventario booleano en el momento de la transacción para evitar ventas de agotados.
     */
    public function createOrder(string $tableNumber, string $waiterName, array $items, ?string $notes = null): array {
        if (empty($items)) {
            throw new Exception("El pedido debe contener al menos un producto.");
        }

        $this->db->beginTransaction();

        try {
            $totalAmount = 0.0;
            $totalWeight = 0;
            $validatedItems = [];

            // Pre-validar items y disponibilidad booleana
            $itemIds = array_column($items, 'menu_item_id');
            $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
            
            $stmt = $this->db->prepare("SELECT * FROM menu_items WHERE id IN ($placeholders)");
            $stmt->execute($itemIds);
            $dbItems = [];
            foreach ($stmt->fetchAll() as $row) {
                $dbItems[$row['id']] = $row;
            }

            foreach ($items as $item) {
                $mId = (int)$item['menu_item_id'];
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $sauceNotes = trim($item['sauce_or_notes'] ?? '');

                if (!isset($dbItems[$mId])) {
                    throw new Exception("El producto con ID {$mId} no existe en la carta.");
                }

                $dbItem = $dbItems[$mId];

                // REGLA CLAVE: Validación estricta de inventario booleano
                if ((int)$dbItem['is_available'] !== 1) {
                    throw new Exception("El producto '{$dbItem['name']}' acaba de ser marcado como AGOTADO en cocina.");
                }

                $linePrice = (float)$dbItem['price'] * $qty;
                $lineWeight = (int)$dbItem['prep_weight'] * $qty;

                $totalAmount += $linePrice;
                $totalWeight += $lineWeight;

                $validatedItems[] = [
                    'menu_item_id' => $mId,
                    'item_name' => $dbItem['name'],
                    'item_weight' => (int)$dbItem['prep_weight'],
                    'quantity' => $qty,
                    'unit_price' => (float)$dbItem['price'],
                    'sauce_or_notes' => $sauceNotes
                ];
            }

            // Insertar Cabecera de Orden
            $stmtOrder = $this->db->prepare("
                INSERT INTO orders (table_number, waiter_name, status, total_amount, total_weight, notes, created_at)
                VALUES (:table_num, :waiter, 'pending', :total_amount, :total_weight, :notes, NOW())
            ");
            $stmtOrder->execute([
                ':table_num' => trim($tableNumber),
                ':waiter' => trim($waiterName),
                ':total_amount' => $totalAmount,
                ':total_weight' => $totalWeight,
                ':notes' => $notes ? trim($notes) : null
            ]);

            $orderId = (int)$this->db->lastInsertId();

            // Insertar Detalle de Items
            $stmtItem = $this->db->prepare("
                INSERT INTO order_items (order_id, menu_item_id, item_name, item_weight, quantity, unit_price, sauce_or_notes, status)
                VALUES (:order_id, :menu_id, :name, :weight, :qty, :price, :notes, 'pending')
            ");

            foreach ($validatedItems as $vItem) {
                $stmtItem->execute([
                    ':order_id' => $orderId,
                    ':menu_id' => $vItem['menu_item_id'],
                    ':name' => $vItem['item_name'],
                    ':weight' => $vItem['item_weight'],
                    ':qty' => $vItem['quantity'],
                    ':price' => $vItem['unit_price'],
                    ':notes' => $vItem['sauce_or_notes']
                ]);
            }

            $this->db->commit();

            return [
                'order_id' => $orderId,
                'table_number' => $tableNumber,
                'total_amount' => $totalAmount,
                'total_weight' => $totalWeight,
                'status' => 'pending',
                'items_count' => count($validatedItems)
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Obtiene pedidos activos para el KDS de cocina (pending y in_prep).
     */
    public function getActiveKitchenOrders(): array {
        $sql = "
            SELECT o.*,
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status IN ('pending', 'in_prep')
            GROUP BY o.id
            ORDER BY o.created_at ASC
        ";

        $orders = $this->db->query($sql)->fetchAll();

        // Cargar items asociados
        foreach ($orders as &$order) {
            $stmt = $this->db->prepare("SELECT * FROM order_items WHERE order_id = :order_id");
            $stmt->execute([':order_id' => $order['id']]);
            $order['items'] = $stmt->fetchAll();
            $order['total_amount'] = (float)$order['total_amount'];
            $order['total_weight'] = (int)$order['total_weight'];
        }

        return $orders;
    }

    /**
     * Transición de estado en KDS (pending -> in_prep -> ready -> delivered -> cancelled)
     */
    public function updateStatus(int $orderId, string $status): bool {
        $allowed = ['pending', 'in_prep', 'ready', 'delivered', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            throw new Exception("Estado de orden inválido.");
        }

        $extraSql = "";
        if ($status === 'in_prep') {
            $extraSql = ", prep_started_at = COALESCE(prep_started_at, NOW())";
        } elseif ($status === 'ready' || $status === 'delivered') {
            $extraSql = ", completed_at = COALESCE(completed_at, NOW())";
        }

        $stmt = $this->db->prepare("UPDATE orders SET status = :status {$extraSql} WHERE id = :id");
        return $stmt->execute([':status' => $status, ':id' => $orderId]);
    }
}
