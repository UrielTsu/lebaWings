<?php
declare(strict_types=1);

namespace LebaWings\Services;

class PriorityQueueService {
    /**
     * Calcula la puntuación de prioridad dinámica para el KDS de cocina.
     * 
     * Regla de Negocio:
     * - Peso 1: Rápido (Bebidas preparadas, papas sencillas, postres rápidos).
     * - Peso 2: Medio (Boneless individuales, hamburguesas estándar).
     * - Peso 3: Complejo (Combos familiares de 40 alitas, términos especiales, platillos dobles).
     *
     * Fórmula:
     * PriorityScore = (ElapsedMinutes * 2.5) + (WeightedSum * 1.2) + UrgencyOffset
     */
    public static function calculateScore(array $order): array {
        $createdAt = strtotime($order['created_at']);
        $now = time();
        $elapsedMinutes = max(0, round(($now - $createdAt) / 60, 1));

        $totalWeight = (int)($order['total_weight'] ?? 0);
        $itemCount = (int)($order['item_count'] ?? 1);

        // Si el tiempo transcurrido supera umbrales críticos, se dispara un multiplicador de envejecimiento
        $timeMultiplier = 2.8;
        if ($elapsedMinutes > 15) {
            $timeMultiplier = 4.2; // Evita inanición (starvation) de órdenes complejas
        }

        // Puntuación calculada
        $score = ($elapsedMinutes * $timeMultiplier) + ($totalWeight * 1.5);

        // Clasificación visual y de alerta
        $urgencyLevel = 'NORMAL';
        $slaStatus = 'green';

        if ($elapsedMinutes >= 18 || $score >= 70) {
            $urgencyLevel = 'CRÍTICO';
            $slaStatus = 'red';
        } elseif ($elapsedMinutes >= 10 || $score >= 40) {
            $urgencyLevel = 'ATENCIÓN';
            $slaStatus = 'yellow';
        }

        return [
            'priority_score' => round($score, 2),
            'elapsed_minutes' => $elapsedMinutes,
            'urgency_level' => $urgencyLevel,
            'sla_status' => $slaStatus,
            'estimated_prep_time' => self::estimatePrepMinutes($totalWeight, $itemCount)
        ];
    }

    /**
     * Estimación de tiempo de cocina en base al peso acumulado.
     */
    public static function estimatePrepMinutes(int $totalWeight, int $itemCount): int {
        // Base de preparación + escala según complejidad
        return max(5, min(40, (int)(4 + ($totalWeight * 2.2))));
    }

    /**
     * Ordena la lista de pedidos activos según la cola de prioridad.
     */
    public static function sortQueue(array &$orders): void {
        foreach ($orders as &$order) {
            $metrics = self::calculateScore($order);
            $order = array_merge($order, $metrics);
        }
        unset($order);

        // Ordenar descendentemente por priority_score (el mayor puntaje va primero en KDS)
        usort($orders, function ($a, $b) {
            // Priorizar órdenes en preparación si ya fueron tomadas
            if ($a['status'] === 'in_prep' && $b['status'] !== 'in_prep') {
                return -1;
            }
            if ($b['status'] === 'in_prep' && $a['status'] !== 'in_prep') {
                return 1;
            }
            return $b['priority_score'] <=> $a['priority_score'];
        });
    }
}
