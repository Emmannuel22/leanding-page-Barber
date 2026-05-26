// EmailObserver.ts — Maneja notificaciones por email

import type { Observer } from '../events/EventEmitter';
import { EVENTS } from '../events/AppointmentEvents';

export class EmailObserver implements Observer {
  private serviceId: string;
  private templateOwner: string;
  private templateClient: string;
  private publicKey: string;

  constructor() {
    this.serviceId = import.meta.env.EMAILJS_SERVICE_ID;
    this.templateOwner = import.meta.env.EMAILJS_TEMPLATE_OWNER;
    this.templateClient = import.meta.env.EMAILJS_TEMPLATE_CLIENT;
    this.publicKey = import.meta.env.EMAILJS_PUBLIC_KEY;

    console.log('EmailsObservers init', {
      serviceId: this.serviceId,
      templateClient: this.templateClient,
      templateOwner: this.templateOwner,
      publicKey: this.publicKey ? '✅ existe' : '❌ undefined',
    });
  }

  async update(event: string, data: any): Promise<void> {
    switch (event) {
      case EVENTS.APPOINTMENT_CREATED:
        await this.notifyOwner(data);
        break;
      case EVENTS.APPOINTMENT_ACCEPTED:
        await this.notifyClient(data, 'accepted');
        break;
      case EVENTS.APPOINTMENT_REJECTED:
        await this.notifyClient(data, 'rejected');
        break;
      case EVENTS.APPOINTMENT_CANCELLED:
        await this.notifyOwnerCancelled(data);
        break;
    }
  }

  private async sendEmail(templateId: string, params: Record<string, any>): Promise<void> {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: this.serviceId,
        template_id: templateId,
        user_id: this.publicKey,
        accessToken: import.meta.env.EMAILJS_PRIVATE_KEY,
        template_params: params,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`EmailJS error: ${error}`);
    }
  }

  private async notifyOwner(apt: any): Promise<void> {
    await this.sendEmail(this.templateOwner, {
      client_name: apt.name,
      client_phone: apt.phone,
      service: apt.service,
      date: apt.date,
      time: apt.time,
      persons: apt.persons,
      notes: apt.notes || 'Sin notas',
      products: apt.products || 'Ninguno',
    });
  }

  private async notifyClient(apt: any, status: string): Promise<void> {
    await this.sendEmail(this.templateClient, {
      client_name: apt.name,
      client_email: apt.email,
      service: apt.service,
      date: apt.date,
      time: apt.time,
      persons: apt.persons ?? 1,
      products: apt.products ?? 'Ninguno',
      status: status === 'accepted' ? '✅ Confirmada' : '❌ Rechazada',
      message: status === 'accepted'
        ? '¡Tu cita ha sido confirmada! Te esperamos puntual.'
        : 'Lo sentimos, tu cita no pudo ser confirmada. Por favor contáctanos para reagendar.',
      cancel_link: `http://localhost:4321/cancelar?id=${apt.id}`,
    });
  }

  private async notifyOwnerCancelled(apt: any): Promise<void> {
    // NOtificar al Dueño
    await this.sendEmail(this.templateOwner, {
      client_name: apt.name,
      client_phone: apt.phone,
      service: apt.service,
      date: apt.date,
      time: apt.time,
      persons: apt.persons,
      notes: `⚠️ CITA CANCELADA por el cliente. ${apt.notes || ''}`,
      products: apt.products || 'Ninguno',
    });

    if (apt.email) {
        await this.sendEmail(this.templateClient, {
            client_name: apt.name,
            client_email: apt.email,
            service: apt.service,
            date: apt.date,
            time: apt.time,
            persons: apt.persons ?? 1,
            products: apt.products ?? 'Ninguno',
            status: '🚫 Cancelada',
            message: 'Tu cita ha sido cancelada exitosamente. Si deseas reagendar visita nuestra página.',
            cancel_link: '',
        });
    }    
  }
}