import { EventEmitter } from 'events';

class ScraperEventBus extends EventEmitter {
  public publish(event: string, payload: any): void {
    this.emit(event, payload);
  }
}

export const EventBus = new ScraperEventBus();
