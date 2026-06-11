import { useEffect } from "react"
import { createConsumer } from "@rails/actioncable"

const consumer = createConsumer()

export function useChannel(channelParams, onMessage) {
  useEffect(() => {
    if (!channelParams) return undefined

    const subscription = consumer.subscriptions.create(channelParams, {
      received(message) {
        onMessage(message)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [JSON.stringify(channelParams), onMessage])
}
