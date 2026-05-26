// AppointmentEvents.ts — Eventos específicos de citas

import { EventEmitter } from './EventEmitter';

// Singleton del emisor de eventos
let emitterInstance: EventEmitter | null = null;

export function getEmitter(): EventEmitter {
  if (!emitterInstance) {
    emitterInstance = new EventEmitter();
  }
  return emitterInstance;
}

// Nombres de eventos
export const EVENTS = {
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_ACCEPTED: 'appointment:accepted',
  APPOINTMENT_REJECTED: 'appointment:rejected',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
} as const;