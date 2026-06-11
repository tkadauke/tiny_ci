import React from "react"
import { createConsumer } from "@rails/actioncable"

const consumer = createConsumer()

export function useChannel(channel, received) {
  React.useEffect(() => {
    const subscription = consumer.subscriptions.create(channel, { received })

    return () => {
      consumer.subscriptions.remove(subscription)
    }
  }, [channel, received])
}

