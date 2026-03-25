import { describe, it, expect } from "vitest";
import {
  formatOutreachEventType,
  mapOutreachEventTypeToMetric,
} from "@/lib/leads/outreachEvents";

describe("outreachEvents helpers", () => {
  it("maps event types to the correct lead metric", () => {
    expect(mapOutreachEventTypeToMetric("SENT")).toBe("sentCount");
    expect(mapOutreachEventTypeToMetric("OPEN")).toBe("openCount");
    expect(mapOutreachEventTypeToMetric("CLICK")).toBe("clickCount");
    expect(mapOutreachEventTypeToMetric("REPLY")).toBe("responseCount");
    expect(mapOutreachEventTypeToMetric("BOUNCE")).toBe("bounceCount");
    expect(mapOutreachEventTypeToMetric("DELIVERED")).toBeNull();
  });

  it("formats event labels for the UI", () => {
    expect(formatOutreachEventType("SENT")).toBe("Sent");
    expect(formatOutreachEventType("HARD_BOUNCE")).toBe("Hard Bounce");
  });
});
