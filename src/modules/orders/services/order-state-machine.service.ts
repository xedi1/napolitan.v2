import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export interface StateTransition {
  from: OrderStatus[];
  to: OrderStatus;
  action: string;
}

const STATE_TRANSITIONS: StateTransition[] = [
  { from: [], to: OrderStatus.PENDING, action: 'create' },
  { from: [OrderStatus.PENDING], to: OrderStatus.CONFIRMED, action: 'confirm' },
  { from: [OrderStatus.CONFIRMED], to: OrderStatus.PREPARING, action: 'start_preparing' },
  { from: [OrderStatus.PREPARING], to: OrderStatus.READY, action: 'mark_ready' },
  { from: [OrderStatus.READY], to: OrderStatus.SERVED, action: 'serve' },
  { from: [OrderStatus.SERVED], to: OrderStatus.PAID, action: 'pay' },
  // Cancellation from any active state
  { from: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING], to: OrderStatus.CANCELLED, action: 'cancel' },
];

export class OrderStateMachine {
  static canTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const transition = STATE_TRANSITIONS.find(
      (t) => t.to === newStatus && t.from.includes(currentStatus),
    );
    return !!transition;
  }

  static validateTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions: ${this.getValidTransitions(currentStatus).join(', ') || 'none'}`,
      );
    }
  }

  static getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
    return STATE_TRANSITIONS
      .filter((t) => t.from.includes(currentStatus))
      .map((t) => t.to);
  }

  static isActiveStatus(status: OrderStatus): boolean {
    const activeStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY];
    return activeStatuses.includes(status);
  }

  static isFinalStatus(status: OrderStatus): boolean {
    const finalStatuses: OrderStatus[] = [OrderStatus.SERVED, OrderStatus.PAID, OrderStatus.CANCELLED];
    return finalStatuses.includes(status);
  }

  static getActionForTransition(newStatus: OrderStatus): string {
    const transition = STATE_TRANSITIONS.find((t) => t.to === newStatus);
    return transition?.action || 'update';
  }
}
