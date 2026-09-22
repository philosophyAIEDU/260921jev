import { describe, expect, it } from "vitest";
import { elapsedHoursSince, formatElapsed, parseReceivedAt } from "../src/lib/slaUtils";

describe("parseReceivedAt", () => {
  it("ISO 형식과 공백 구분 형식을 모두 파싱한다", () => {
    expect(parseReceivedAt("2026-09-01T08:00:00")).not.toBeNull();
    expect(parseReceivedAt("2026-09-01 08:00:00")).not.toBeNull();
  });

  it("빈 값이나 파싱 불가능한 값은 null을 반환한다", () => {
    expect(parseReceivedAt(undefined)).toBeNull();
    expect(parseReceivedAt("")).toBeNull();
    expect(parseReceivedAt("알 수 없음")).toBeNull();
  });
});

describe("elapsedHoursSince / formatElapsed", () => {
  it("경과 시간을 시간 단위로 계산한다", () => {
    const start = new Date("2026-09-01T00:00:00Z");
    const now = new Date("2026-09-02T00:00:00Z");
    expect(elapsedHoursSince(start, now)).toBeCloseTo(24, 5);
  });

  it("1시간 미만은 분으로 표시한다", () => {
    expect(formatElapsed(0.5)).toContain("분 경과");
  });

  it("48시간 미만은 시간으로, 이상은 일 단위로 표시한다", () => {
    expect(formatElapsed(10)).toContain("시간 경과");
    expect(formatElapsed(72)).toContain("일 경과");
  });
});
