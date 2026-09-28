import { Order, UrgencyLevel } from '../types/restaurant';

export const PriorityEngine = {
  /**
   * Calcula el PriorityScore idéntico a PriorityQueueService.php
   * Considera minutos transcurridos y peso acumulado de la comanda.
   */
  calculateOrderMetrics(order: Order, now: Date = new Date()): {
    priority_score: number;
    elapsed_minutes: number;
    urgency_level: UrgencyLevel;
    sla_status: 'green' | 'yellow' | 'red';
    estimated_prep_time: number;
  } {
    const createdTime = new Date(order.created_at).getTime();
    const elapsedMinutes = Math.max(0, Math.round(((now.getTime() - createdTime) / 60000) * 10) / 10);

    const totalWeight = order.total_weight || order.items.reduce((sum, it) => sum + (it.item_weight * it.quantity), 0);
    const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);

    // Multiplicador de envejecimiento (evita inanición de platos pesados)
    let timeMultiplier = 2.8;
    if (elapsedMinutes > 15) {
      timeMultiplier = 4.2;
    }

    const score = (elapsedMinutes * timeMultiplier) + (totalWeight * 1.5);

    let urgency_level: UrgencyLevel = 'NORMAL';
    let sla_status: 'green' | 'yellow' | 'red' = 'green';

    if (elapsedMinutes >= 18 || score >= 70) {
      urgency_level = 'CRÍTICO';
      sla_status = 'red';
    } else if (elapsedMinutes >= 10 || score >= 40) {
      urgency_level = 'ATENCIÓN';
      sla_status = 'yellow';
    }

    const estimated_prep_time = Math.max(5, Math.min(40, Math.round(4 + (totalWeight * 2.2))));

    return {
      priority_score: Math.round(score * 10) / 10,
      elapsed_minutes: elapsedMinutes,
      urgency_level,
      sla_status,
      estimated_prep_time,
    };
  },

  /**
   * Ordena la cola de cocina:
   * 1. Las órdenes en preparación activa ('in_prep') van al inicio del pase.
   * 2. Dentro de cada grupo, ordenadas descendentemente por priority_score.
   */
  sortKitchenQueue(orders: Order[], now: Date = new Date()): Order[] {
    const scoredOrders = orders.map((order) => {
      const metrics = this.calculateOrderMetrics(order, now);
      return {
        ...order,
        ...metrics,
      };
    });

    return scoredOrders.sort((a, b) => {
      if (a.status === 'in_prep' && b.status !== 'in_prep') return -1;
      if (b.status === 'in_prep' && a.status !== 'in_prep') return 1;
      return (b.priority_score || 0) - (a.priority_score || 0);
    });
  },
};
