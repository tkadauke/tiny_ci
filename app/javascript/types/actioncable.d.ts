declare module "@rails/actioncable" {
  export interface Subscription {
    unsubscribe(): void;
  }

  export interface Subscriptions {
    create(
      channel: Record<string, unknown>,
      mixin: Record<string, unknown>
    ): Subscription;
  }

  export interface Consumer {
    subscriptions: Subscriptions;
  }

  export function createConsumer(url?: string): Consumer;
}
