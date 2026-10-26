import { readFileSync } from "node:fs";
import {
  type FieldSpec,
  parseBoolean,
  parseCsv,
  parseDate,
  parseNumber,
  type SpecOutput,
} from "../../src/lib/csv";
import { SPEC } from "../../src/lib/flightCsvSpec";
import type { Flight } from "../../src/types";

const csv = { parseCsv, parseBoolean, parseDate, parseNumber };

const data = `
b_col,d_col,n_col,s_col
true,01-Jul-2017,12,cell
`;

describe("CSV", () => {
  describe("parseSpec", () => {
    it("should parse boolean primitive", () => {
      const spec = {
        src: "b_col",
        type: "boolean",
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([true]);
    });

    it("should parse boolean primitive with xform", () => {
      const spec = {
        src: "b_col",
        type: "boolean",
        xform: (b: boolean) => b !== true,
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([false]);
    });

    it("should parse date primitive with xform", () => {
      const spec = {
        src: "d_col",
        type: "date",
        xform: (d: Date) => d.getFullYear(),
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([2017]);
    });

    it("should parse date primitive", () => {
      const spec = {
        src: "d_col",
        type: "date",
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([new Date("2017-07-01")]);
    });

    it("should parse number primitive with xform", () => {
      const spec = {
        src: "n_col",
        type: "number",
        xform: (n: number) => 2 * n,
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([24]);
    });

    it("should parse number primitive", () => {
      const spec = {
        src: "n_col",
        type: "number",
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([12]);
    });

    it("should parse string primitive with xform", () => {
      const spec = {
        src: "s_col",
        type: "string",
        xform: (s: string) => s.toUpperCase(),
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual(["CELL"]);
    });

    it("should parse string primitive", () => {
      const spec = {
        src: "s_col",
        type: "string",
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual(["cell"]);
    });

    it("should trim surrounding whitespace from strings", () => {
      // BGA data has had names with trailing spaces, e.g. "Landen, George ".
      const spec = { src: "s_col", type: "string" } satisfies FieldSpec;
      const padded = `s_col\n"  George "\n`;

      expect(csv.parseCsv(spec, padded)).toEqual(["George"]);
    });

    it("should parse object with xform", () => {
      const spec = {
        src: {
          boolean: {
            src: "b_col",
            type: "boolean",
          },
          number: {
            src: "n_col",
            type: "number",
            xform: (n: number) => -n,
          },
        },
        type: "object",
        xform: (o: object) => ({ xformed: true, ...o }),
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([
        {
          boolean: true,
          number: -12,
          xformed: true,
        },
      ]);
    });

    it("should parse object", () => {
      const spec = {
        src: {
          boolean: {
            src: "b_col",
            type: "boolean",
          },
          number: {
            src: "n_col",
            type: "number",
            xform: (n: number) => -n,
          },
        },
        type: "object",
      } satisfies FieldSpec;

      expect(csv.parseCsv(spec, data)).toEqual([
        {
          boolean: true,
          number: -12,
        },
      ]);
    });

    it("should parse array with xform", () => {
      const data = `
h1,h2,h3
c1,c2,c1
`;
      const spec = {
        src: [
          {
            src: "h1",
            type: "string",
          },
          {
            src: "h2",
            type: "string",
          },
          {
            src: "h3",
            type: "string",
          },
        ],
        type: "array",
        xform: (a: string[]) => new Set(a),
      } satisfies FieldSpec;
      const json = csv.parseCsv(spec, data);
      expect(json).toEqual([new Set(["c1", "c2"])]);
    });

    it("should parse array", () => {
      const spec = {
        src: [
          {
            src: "s_col",
            type: "string",
          },
          {
            src: "b_col",
            type: "boolean",
          },
        ],
        type: "array",
      } satisfies FieldSpec;
      const json = csv.parseCsv(spec, data);
      expect(json).toEqual([["cell", true]]);
    });

    it("should throw when src not specified", () => {
      const spec = {
        type: "boolean",
      } as unknown as FieldSpec;

      expect(() => csv.parseCsv(spec, data)).toThrow(
        `'src' not specified in spec: {"type":"boolean"}`,
      );
    });

    it("should throw when type not specified", () => {
      const spec = {
        src: "b_col",
      } as unknown as FieldSpec;

      expect(() => csv.parseCsv(spec, data)).toThrow(
        'Unknown type in spec: {"src":"b_col"}',
      );
    });
  });

  describe("column checks", () => {
    const spec = {
      src: {
        a: { src: "a_col", type: "string" },
        b: { src: "b_col", type: "number" },
        c: { src: "c_col", type: "boolean" },
      },
      type: "object",
    } satisfies FieldSpec;

    it("names a missing column", () => {
      expect(() => csv.parseCsv(spec, "a_col,b_col\nx,1\n")).toThrow(
        'Missing CSV column "c_col"',
      );
    });

    it("names every missing column", () => {
      expect(() => csv.parseCsv(spec, "a_col\nx\n")).toThrow(
        'Missing CSV columns "b_col", "c_col"',
      );
    });

    it("checks the header even when there are no rows", () => {
      expect(() => csv.parseCsv(spec, "a_col\n")).toThrow(
        'Missing CSV columns "b_col", "c_col"',
      );
    });

    it("returns no rows for an empty response", () => {
      expect(csv.parseCsv(spec, "")).toEqual([]);
    });

    it("reports a renamed BGA column in the flight spec", () => {
      const fixture = readFileSync(
        new URL("../../e2e/fixtures/2025.csv", import.meta.url),
        "utf8",
      );
      const renamed = fixture.replace('"Completed?"', '"Completed"');

      expect(() => csv.parseCsv(SPEC, renamed)).toThrow(
        'Missing CSV column "Completed?"',
      );
    });

    it("parses the flight spec to a Flight", () => {
      expectTypeOf<SpecOutput<typeof SPEC>>().toEqualTypeOf<Flight>();
    });
  });

  describe("parseBoolean", () => {
    ["True", "true", "TRUE", "1"].forEach((val) => {
      it(`should parse '${val}' as a boolean true`, () => {
        expect(csv.parseBoolean(val)).toBe(true);
      });
    });

    ["T", "false", "foo", "0", ""].forEach((val) => {
      it(`should parse '${val}' as a boolean false`, () => {
        expect(csv.parseBoolean(val)).toBe(false);
      });
    });
  });

  describe("parseDate", () => {
    [
      { val: "01-Jul-2017", expected: "Sat, 01 Jul 2017 00:00:00 GMT" },
      { val: "01-Dec-2017", expected: "Fri, 01 Dec 2017 00:00:00 GMT" },
    ].forEach(({ val, expected }) => {
      it(`should parse '${val}' as a UTC date`, () => {
        const actual = csv.parseDate(val);
        expect(actual).toBeInstanceOf(Date);
        expect(actual.toUTCString()).toEqual(expected);
      });

      [
        "32-Jan-2017", // day too large
        "31-Foo-2017", // month does not exist
        "01-Dec-2017 00:00:00", // includes time
        "01/31/2017", // day/month wrong order
        "01-31-2017", // day/month wrong order, dash separators
        "31-01-2017", // dash separators
        "2017/01/31", // year first
        "2017-01-31", // year first, dash separators
        "2017-01-31T01:23:45", // ISO8601-format
        "true",
        "1.1",
        "foobar",
      ].forEach((str) => {
        it(`should throw when date is of invalid format (${str})`, () => {
          expect(() => csv.parseDate(str)).toThrow(
            `Invalid date format: ${str}`,
          );
        });
      });
    });
  });

  describe("parseNumber", () => {
    [
      { str: "1", number: 1 },
      { str: "1.1", number: 1.1 },
      { str: "", number: 0 },
    ].forEach(({ str, number }) => {
      it(`should parse '${str}' as a Number`, () => {
        expect(csv.parseNumber(str)).toBe(number);
      });
    });

    ["true", "foobar", "01/02/2017"].forEach((str) => {
      it(`should throw when number if of invalid format (${str})`, () => {
        expect(() => csv.parseNumber(str)).toThrow(
          `Invalid number format: ${str}`,
        );
      });
    });
  });
});
