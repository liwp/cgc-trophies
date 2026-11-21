import { expandedKeys, withExpanded } from "../../src/lib/useExpanded";

describe("expandedKeys", () => {
  it("reads the expanded rows from an entry's state", () => {
    expect(expandedKeys({ expanded: ["day:1", "task:A-B"] })).toEqual([
      "day:1",
      "task:A-B",
    ]);
  });

  it("is empty for an entry with no state, or none of its own", () => {
    expect(expandedKeys(null)).toEqual([]);
    expect(expandedKeys(undefined)).toEqual([]);
    expect(expandedKeys({ pushedFlight: true })).toEqual([]);
  });

  it("ignores anything that isn't a list of keys", () => {
    expect(expandedKeys({ expanded: "day:1" })).toEqual([]);
    expect(expandedKeys({ expanded: ["day:1", 2, null] })).toEqual(["day:1"]);
  });
});

describe("withExpanded", () => {
  it("adds a row once", () => {
    const once = withExpanded(null, "day:1", true);
    expect(once).toEqual({ expanded: ["day:1"] });
    expect(withExpanded(once, "day:1", true)).toEqual({ expanded: ["day:1"] });
  });

  it("removes a row, keeping the others", () => {
    expect(
      withExpanded({ expanded: ["day:1", "day:2"] }, "day:1", false),
    ).toEqual({ expanded: ["day:2"] });
  });

  it("keeps the rest of the entry's state", () => {
    expect(withExpanded({ pushedFlight: true }, "day:1", true)).toEqual({
      pushedFlight: true,
      expanded: ["day:1"],
    });
  });
});
