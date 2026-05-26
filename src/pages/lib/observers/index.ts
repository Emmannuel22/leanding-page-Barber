// index.ts — Inicializa observers y los conecta a los eventos

import { getEmitter } from '../events/AppointmentEvents';
import { EmailObserver } from './EmailObserver';
import { LogObserver } from './LogObserver';

let initialized = false;

export function initObservers(): void {
  if (initialized) return;

  const emitter = getEmitter();
  const emailObserver = new EmailObserver();
  const logObserver = new LogObserver();

  // Suscribir observers a todos los eventos
  Object.values({
    APPOINTMENT_CREATED: 'appointment:created',
    APPOINTMENT_ACCEPTED: 'appointment:accepted',
    APPOINTMENT_REJECTED: 'appointment:rejected',
    APPOINTMENT_CANCELLED: 'appointment:cancelled',
  }).forEach(event => {
    emitter.subscribe(event, emailObserver);
    emitter.subscribe(event, logObserver);
  });

  initialized = true;
  console.log('✅ Observers inicializados');
}