import records from "../../records.config";
import {
  formatClubRecordValue,
  groupCategories,
  recordHistory,
  routeTooltip,
  turnpointLabel,
  turnpointText,
  ukRecordTooltip,
} from "../../src/lib/recordDisplay";
import { formatRecordValue } from "../../src/lib/records";
import type { RecordCategory } from "../../src/types";

const category = (id: string) => {
  const c = records.find((x) => x.id === id);
  if (!c) throw new Error(`no category ${id}`);
  return c;
};

describe("turnpointLabel", () => {
  it("names a current BGA turnpoint", () => {
    expect(turnpointLabel("TAL")).toEqual({ code: "TAL", name: "Talgarth" });
  });

  it("gives a removed turnpoint its removal season", () => {
    expect(turnpointLabel("BIC")).toEqual({
      code: "BIC",
      name: "Bicester Control Tower",
      removed: 2026,
    });
  });

  it("invents a code for a custom turnpoint", () => {
    expect(turnpointLabel({ name: "Molesworth" })).toEqual({
      code: "MOL*",
      name: "Molesworth",
      custom: true,
    });
  });

  it("rejects an unknown code", () => {
    expect(() => turnpointLabel("ZZZ")).toThrow("ZZZ");
  });
});

describe("turnpointText", () => {
  it("shows a current turnpoint's code", () => {
    expect(turnpointText(turnpointLabel("TAL"))).toBe("TAL");
  });

  it("shows a custom turnpoint's invented code", () => {
    expect(turnpointText(turnpointLabel({ name: "Molesworth" }))).toBe("MOL*");
  });

  it("shows when a removed turnpoint was removed", () => {
    expect(turnpointText(turnpointLabel("BIC"))).toBe("BIC ’26");
  });
});

describe("routeTooltip", () => {
  it("names a route's turnpoints in order", () => {
    expect(routeTooltip(["SEW", "COC", "CHD"])).toBe(
      "Sheffield West – Colchester – Chesterfield",
    );
  });

  it("notes a removed turnpoint", () => {
    expect(routeTooltip(["BIC", "SCU", "GAB"])).toBe(
      "Bicester Control Tower (removed 2026) – Scunthorpe N – Garboldisham",
    );
  });

  it("notes a custom turnpoint", () => {
    expect(routeTooltip([{ name: "Molesworth" }, "OLN"])).toBe(
      "Molesworth (custom, not in the BGA list) – Olney",
    );
  });
});

describe("ukRecordTooltip", () => {
  const withUk = (ukRecord: RecordCategory["ukRecord"]) => ({
    ...category("fastest-500-or"),
    ukRecord,
  });

  it("lists a current UK record's lists", () => {
    expect(
      ukRecordTooltip(
        withUk({
          status: "current",
          lists: ["UK Standard", "UK Feminine Open"],
        }),
      ),
    ).toBe("Current UK record: UK Standard, UK Feminine Open");
  });

  it("marks a former UK record", () => {
    expect(
      ukRecordTooltip(withUk({ status: "former", lists: ["UK Open"] })),
    ).toBe("Former UK record: UK Open");
  });

  it("is null without a UK record", () => {
    expect(ukRecordTooltip(withUk(undefined))).toBeNull();
  });
});

describe("groupCategories", () => {
  it("groups the records in display order", () => {
    const groups = groupCategories(records);
    expect(groups.map((g) => g.heading)).toEqual([
      "Distance",
      "Triangles",
      "Out-and-returns",
      "Height",
    ]);
    expect(groups.map((g) => g.categories.length)).toEqual([3, 6, 6, 2]);
    expect(groups[1].categories.map((c) => c.code)).toEqual([
      "600km △",
      "500km △",
      "400km △",
      "300km △",
      "200km △",
      "100km △",
    ]);
  });
});

describe("recordHistory", () => {
  it("lists superseded records newest first", () => {
    expect(
      recordHistory(category("fastest-200-or")).map((r) => r.date),
    ).toEqual(["2013-08-31", "2010-08-31", "1996-08-19"]);
  });
});

describe("formatClubRecordValue", () => {
  it.each(["fastest-500-or", "longest-distance", "absolute-height"])(
    "formats %s's record as the records page does",
    (id) => {
      const c = category(id);
      if (!c.record) throw new Error(`no record for ${id}`);
      expect(formatClubRecordValue(c.rule, c.record)).toBe(
        formatRecordValue(c),
      );
    },
  );
});
