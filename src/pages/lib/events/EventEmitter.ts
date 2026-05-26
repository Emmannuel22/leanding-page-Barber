// EventEmitter.ts — Subject base del patrón Observer

export interface Observer {
  update(event: string, data: any): Promise<void>;
}

export class EventEmitter {
  private observers: Map<string, Observer[]> = new Map();

  // Suscribir un observer a un evento
  subscribe(event: string, observer: Observer): void {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event)!.push(observer);
  }

  // Desuscribir un observer
  unsubscribe(event: string, observer: Observer): void {
    if (!this.observers.has(event)) return;
    const filtered = this.observers.get(event)!.filter(o => o !== observer);
    this.observers.set(event, filtered);
  }

  // Notificar a todos los observers de un evento
  async emit(event: string, data: any): Promise<void> {
    if (!this.observers.has(event)) return;
    const observers = this.observers.get(event)!;
    await Promise.all(observers.map(o => o.update(event, data)));
  }
}