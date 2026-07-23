// Order Status enum values
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// Order Status Transition validator
const OrderStatusTransition = {
  isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.SERVED],
      [OrderStatus.SERVED]: [OrderStatus.PAID],
      [OrderStatus.PAID]: [],
      [OrderStatus.CANCELLED]: [],
    };
    return validTransitions[current]?.includes(next) ?? false;
  }
};

describe('OrderStateMachine', () => {
  describe('Order Status Transitions', () => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.SERVED],
      [OrderStatus.SERVED]: [OrderStatus.PAID],
      [OrderStatus.PAID]: [],
      [OrderStatus.CANCELLED]: [],
    };

    it('should allow transition from PENDING to CONFIRMED', () => {
      const currentStatus = OrderStatus.PENDING;
      const nextStatus = OrderStatus.CONFIRMED;
      
      expect(validTransitions[currentStatus]).toContain(nextStatus);
    });

    it('should allow transition from PENDING to CANCELLED', () => {
      const currentStatus = OrderStatus.PENDING;
      const nextStatus = OrderStatus.CANCELLED;
      
      expect(validTransitions[currentStatus]).toContain(nextStatus);
    });

    it('should not allow transition from PENDING to PREPARING', () => {
      const currentStatus = OrderStatus.PENDING;
      const nextStatus = OrderStatus.PREPARING;
      
      expect(validTransitions[currentStatus]).not.toContain(nextStatus);
    });

    it('should not allow transition from PAID to any other status', () => {
      const currentStatus = OrderStatus.PAID;
      
      expect(validTransitions[currentStatus]).toHaveLength(0);
    });

    it('should not allow transition from CANCELLED to any other status', () => {
      const currentStatus = OrderStatus.CANCELLED;
      
      expect(validTransitions[currentStatus]).toHaveLength(0);
    });

    it('should allow transition from PREPARING to READY', () => {
      const currentStatus = OrderStatus.PREPARING;
      const nextStatus = OrderStatus.READY;
      
      expect(validTransitions[currentStatus]).toContain(nextStatus);
    });

    it('should allow transition from READY to SERVED', () => {
      const currentStatus = OrderStatus.READY;
      const nextStatus = OrderStatus.SERVED;
      
      expect(validTransitions[currentStatus]).toContain(nextStatus);
    });

    it('should allow transition from SERVED to PAID', () => {
      const currentStatus = OrderStatus.SERVED;
      const nextStatus = OrderStatus.PAID;
      
      expect(validTransitions[currentStatus]).toContain(nextStatus);
    });

    it('should follow complete happy path: PENDING -> CONFIRMED -> PREPARING -> READY -> SERVED -> PAID', () => {
      const happyPath = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.SERVED,
        OrderStatus.PAID,
      ];

      for (let i = 0; i < happyPath.length - 1; i++) {
        const current = happyPath[i];
        const next = happyPath[i + 1];
        expect(validTransitions[current]).toContain(next);
      }
    });
  });

  describe('OrderStatusTransition.isValidTransition', () => {
    it('should return true for valid transition', () => {
      expect(OrderStatusTransition.isValidTransition(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED
      )).toBe(true);
    });

    it('should return false for invalid transition', () => {
      expect(OrderStatusTransition.isValidTransition(
        OrderStatus.PENDING,
        OrderStatus.PAID
      )).toBe(false);
    });

    it('should return false for same status transition', () => {
      expect(OrderStatusTransition.isValidTransition(
        OrderStatus.PENDING,
        OrderStatus.PENDING
      )).toBe(false);
    });

    it('should return false for backward transition', () => {
      expect(OrderStatusTransition.isValidTransition(
        OrderStatus.PREPARING,
        OrderStatus.PENDING
      )).toBe(false);
    });
  });

  describe('Order Status Flow Tests', () => {
    it('should handle cancellation at early stages', () => {
      const earlyStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING];
      
      earlyStatuses.forEach(status => {
        expect(OrderStatusTransition.isValidTransition(status, OrderStatus.CANCELLED)).toBe(true);
      });
    });

    it('should not allow cancellation after READY status', () => {
      const lateStatuses = [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.PAID];
      
      lateStatuses.forEach(status => {
        expect(OrderStatusTransition.isValidTransition(status, OrderStatus.CANCELLED)).toBe(false);
      });
    });
  });
});
