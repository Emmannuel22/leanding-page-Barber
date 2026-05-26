// LogObserver.ts — Registra eventos en consola

import type { Observer } from '../events/EventEmitter';

export class LogObserver implements Observer {
  async update(event: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Event: ${event} | Cliente: ${data.name} | Fecha: ${data.date} ${data.time}`);
  }
}