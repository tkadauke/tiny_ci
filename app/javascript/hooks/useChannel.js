import { createConsumer } from "@rails/actioncable"
import { useEffect } from "react"

const consumer = createConsumer()

export function useChannel(channel, params, callbacks = {}) {
  useEffect(() => {
    const subscription = consumer.subscriptions.create(
      { channel, ...params },
      callbacks
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [channel, JSON.stringify(params), callbacks.received])
}
