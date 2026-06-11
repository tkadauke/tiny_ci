import { createConsumer } from "@rails/actioncable"
import { useEffect } from "react"

const consumer = createConsumer()

type ChannelCallbacks = {
  received?: (message: unknown) => void
}

export function useChannel(
  channel: string,
  params: Record<string, string> = {},
  callbacks: ChannelCallbacks = {}
) {
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
