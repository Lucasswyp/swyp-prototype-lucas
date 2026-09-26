import { describe, it, expect } from "vitest";
import { isOldEnough } from "./age";

describe("isOldEnough", () => {
  it("returns false for an invalid birthdate", () => {
    expect(isOldEnough("not-a-date")).toBe(false);
  });

  it("returns true for someone well past the minimum age", () => {
    expect(isOldEnough("2000-01-01")).toBe(true);
  });

  it("returns false for someone younger than the minimum age", () => {
    const now = new Date();
    const tooYoung = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    expect(isOldEnough(tooYoung.toISOString())).toBe(false);
  });

  it("returns false the day before someone's 16th birthday", () => {
    const now = new Date();
    const almost16 = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate() + 1);
    expect(isOldEnough(almost16.toISOString())).toBe(false);
  });

  it("returns true on someone's exact 16th birthday", () => {
    const now = new Date();
    const exactly16 = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate());
    expect(isOldEnough(exactly16.toISOString())).toBe(true);
  });

  it("respects a custom minAge", () => {
    expect(isOldEnough("2015-01-01", 18)).toBe(false);
  });
});
