<?php
declare(strict_types=1);

namespace LebaWings\Models;

use PDO;
use LebaWings\Config\Database;

class MenuItem {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene el menú completo.
     * Si $onlyAvailable es true (usado por la app de Meseros), filtra los no agotados.
     */
    public function getAll(bool $onlyAvailable = false, ?int $categoryId = null): array {
        $sql = "
            SELECT m.*, c.name AS category_name, c.icon AS category_icon
            FROM menu_items m
            INNER JOIN categories c ON m.category_id = c.id
            WHERE 1=1
        ";
        $params = [];

        if ($onlyAvailable) {
            $sql .= " AND m.is_available = 1";
        }

        if ($categoryId !== null) {
            $sql .= " AND m.category_id = :category_id";
            $params[':category_id'] = $categoryId;
        }

        $sql .= " ORDER BY c.id ASC, m.name ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        // Casteo limpio para tipos primitivos
        return array_map(function ($item) {
            return [
                'id' => (int)$item['id'],
                'category_id' => (int)$item['category_id'],
                'category_name' => $item['category_name'],
                'category_icon' => $item['category_icon'],
                'name' => $item['name'],
                'description' => $item['description'],
                'price' => (float)$item['price'],
                'prep_weight' => (int)$item['prep_weight'],
                'is_available' => (bool)$item['is_available'],
                'created_at' => $item['created_at'],
                'updated_at' => $item['updated_at'] ?? null,
            ];
        }, $items);
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM menu_items WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $res = $stmt->fetch();
        return $res ? $res : null;
    }

    /**
     * Alternar Inventario Booleano (Disponible / Agotado)
     */
    public function toggleAvailability(int $id, ?bool $status = null): bool {
        if ($status !== null) {
            $stmt = $this->db->prepare("UPDATE menu_items SET is_available = :status WHERE id = :id");
            return $stmt->execute([':status' => $status ? 1 : 0, ':id' => $id]);
        }

        $stmt = $this->db->prepare("UPDATE menu_items SET is_available = NOT is_available WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Actualizar Peso del Plato (1 = Rápido, 2 = Medio, 3 = Complejo/Lento)
     */
    public function updatePrepWeight(int $id, int $weight): bool {
        if ($weight < 1 || $weight > 3) {
            throw new \InvalidArgumentException("El peso de cocina debe ser estrictamente entre 1 y 3.");
        }

        $stmt = $this->db->prepare("UPDATE menu_items SET prep_weight = :weight WHERE id = :id");
        return $stmt->execute([':weight' => $weight, ':id' => $id]);
    }

    public function create(array $data): int {
        $weight = max(1, min(3, (int)($data['prep_weight'] ?? 2)));
        $isAvailable = isset($data['is_available']) ? ($data['is_available'] ? 1 : 0) : 1;

        $stmt = $this->db->prepare("
            INSERT INTO menu_items (category_id, name, description, price, prep_weight, is_available)
            VALUES (:cat_id, :name, :desc, :price, :weight, :available)
        ");
        $stmt->execute([
            ':cat_id' => (int)$data['category_id'],
            ':name' => trim($data['name']),
            ':desc' => trim($data['description'] ?? ''),
            ':price' => (float)$data['price'],
            ':weight' => $weight,
            ':available' => $isAvailable
        ]);

        return (int)$this->db->lastInsertId();
    }
}
