import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@/test/test-utils";
import cable from "@/lib/cable";
import { useChannel } from "./useChannel";

describe("useChannel", () => {
  it("subscribes and calls the provided callback when data arrives", () => {
    const unsubscribe = vi.fn();
    const create = vi.mocked(cable.subscriptions.create);
    create.mockReturnValue({ unsubscribe });
    const onReceived = vi.fn();

    const { unmount } = renderHook(() => useChannel("QueueChannel", { build_id: 7 }, onReceived));

    expect(create).toHaveBeenCalledWith(
      { channel: "QueueChannel", build_id: 7 },
      expect.objectContaining({ received: expect.any(Function) }),
    );

    const lastCall = create.mock.calls[create.mock.calls.length - 1];
    const callbacks = lastCall[1] as { received: (data: { status: string }) => void };
    callbacks.received({ status: "running" });

    expect(onReceived).toHaveBeenCalledWith({ status: "running" });
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
