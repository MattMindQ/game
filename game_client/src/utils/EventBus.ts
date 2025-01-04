// src/utils/EventBus.ts

type EventCallback = (payload?: any) => void;

interface EventSubscription {
    eventName: string;
    callback: EventCallback;
}

export class EventBus {
    private static events: Map<string, Set<EventCallback>> = new Map();
    private static readonly DEBUG = true;

    public static subscribe(eventName: string, callback: EventCallback): () => void {
        if (this.DEBUG) console.log(`[EventBus] Subscribing to ${eventName}`);

        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        
        const subscribers = this.events.get(eventName);
        subscribers?.add(callback);

        // Return unsubscribe function
        return () => this.unsubscribe(eventName, callback);
    }

    public static unsubscribe(eventName: string, callback: EventCallback): void {
        if (this.DEBUG) console.log(`[EventBus] Unsubscribing from ${eventName}`);
        
        const subscribers = this.events.get(eventName);
        if (subscribers) {
            subscribers.delete(callback);
            if (subscribers.size === 0) {
                this.events.delete(eventName);
            }
        }
    }

    public static emit(eventName: string, payload?: any): void {
        if (this.DEBUG) {
            console.log(`[EventBus] Emitting ${eventName}`, payload);
        }

        const subscribers = this.events.get(eventName);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`[EventBus] Error in subscriber to ${eventName}:`, error);
                }
            });
        }
    }

    public static listSubscribers(eventName?: string): void {
        if (eventName) {
            const subscribers = this.events.get(eventName);
            console.log(`[EventBus] Subscribers for ${eventName}:`, subscribers?.size || 0);
        } else {
            console.log('[EventBus] All subscriptions:', 
                Array.from(this.events.entries()).map(([event, subs]) => ({
                    event,
                    subscribers: subs.size
                }))
            );
        }
    }

    public static clearAllSubscriptions(): void {
        if (this.DEBUG) console.log('[EventBus] Clearing all subscriptions');
        this.events.clear();
    }
}