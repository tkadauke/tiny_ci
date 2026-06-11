import { createConsumer } from "@rails/actioncable"
import { useEffect } from "react"

const consumer = createConsumer()

export function useChannel(channel, params = {}, callbacks = {}) {
  useEffect(() => {
    if (!channel) return undefined

    if (typeof channel === "object") {
      const subscription = consumer.subscriptions.create(channel, {
        received(message) {
          params(message)
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    const subscription = consumer.subscriptions.create(
      { channel, ...params },
      callbacks
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [channel, JSON.stringify(params), callbacks.received])
}
