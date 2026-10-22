import { beforeEach, describe, expect, it, vi } from "vitest";

const native = { value: false };
const impact = vi.fn();
const selectionChanged = vi.fn();
const notification = vi.fn();
const plugin = { throwOnCall: false };

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native.value } }));
vi.mock("@capacitor/haptics", () => ({
  Haptics: {
    impact: (...a: unknown[]) => (plugin.throwOnCall ? Promise.reject(new Error("not implemented")) : impact(...a)),
    selectionChanged: () => selectionChanged(),
    notification: (...a: unknown[]) => notification(...a),
  },
  ImpactStyle: { Light: "LIGHT" },
  NotificationType: { Success: "SUCCESS" },
}));

import { hapticSelect, hapticSuccess, hapticTap } from "@/lib/haptics";
const flush = () => new Promise((r) => setTimeout(r, 30));

beforeEach(() => {
  native.value = false;
  plugin.throwOnCall = false;
  impact.mockReset();
  selectionChanged.mockReset();
  notification.mockReset();
});

describe("haptics", () => {
  it("doet niets op het web", async () => {
    hapticTap();
    hapticSuccess();
    hapticSelect();
    await flush();
    expect(impact).not.toHaveBeenCalled();
    expect(notification).not.toHaveBeenCalled();
    expect(selectionChanged).not.toHaveBeenCalled();
  });

  it("trilt in de native app (de drie soorten na elkaar)", async () => {
    native.value = true;
    hapticTap();
    await flush();
    hapticSuccess();
    await flush();
    hapticSelect();
    await flush();
    expect(impact).toHaveBeenCalledWith({ style: "LIGHT" });
    expect(notification).toHaveBeenCalledWith({ type: "SUCCESS" });
    expect(selectionChanged).toHaveBeenCalledTimes(1);
  });

  it("slikt de fout in een oudere app zonder de plugin", async () => {
    native.value = true;
    plugin.throwOnCall = true;
    expect(() => hapticTap()).not.toThrow();
    await flush();
  });
});
