import { useEffect, useRef } from "react";
import cable from "@/lib/cable";

type ChannelParams = Record<string, unknown>;

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as ChannelParams)[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "undefined";
}

export function useChannel<T>(
  channel: string,
  params: ChannelParams,
  onReceived: (data: T) => void
): void {
  const onReceivedRef = useRef(onReceived);
  const paramsKey = stableStringify(params);

  useEffect(() => {
    onReceivedRef.current = onReceived;
  }, [onReceived]);

  useEffect(() => {
    const subscription = cable.subscriptions.create(
      { channel, ...params },
      {
        received(data: T) {
          onReceivedRef.current(data);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [channel, paramsKey]);
}

export default useChannel;
