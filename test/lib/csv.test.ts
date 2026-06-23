import {
  parseBoolean,
  parseCsv,
  parseDate,
  parseNumber,
} from "../../src/lib/csv";

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
      };

      expect(csv.parseCsv(spec, data)).toEqual([true]);
    });

    it("should parse boolean primitive with xform", () => {
      const spec = {
        src: "b_col",
        type: "boolean",
        xform: (b) => b !== true,
      };

      expect(csv.parseCsv(spec, data)).toEqual([false]);
    });

    it("should parse date primitive with xform", () => {
      const spec = {
        src: "d_col",
        type: "date",
        xform: (d) => d.getFullYear(),
      };

      expect(csv.parseCsv(spec, data)).toEqual([2017]);
    });

    it("should parse date primitive", () => {
      const spec = {
        src: "d_col",
        type: "date",
      };

      expect(csv.parseCsv(spec, data)).toEqual([new Date("2017-07-01")]);
    });

    it("should parse number primitive with xform", () => {
      const spec = {
        src: "n_col",
        type: "number",
        xform: (n) => 2 * n,
      };

      expect(csv.parseCsv(spec, data)).toEqual([24]);
    });

    it("should parse number primitive", () => {
      const spec = {
        src: "n_col",
        type: "number",
      };

      expect(csv.parseCsv(spec, data)).toEqual([12]);
    });

    it("should parse string primitive with xform", () => {
      const spec = {
        src: "s_col",
        type: "string",
        xform: (s) => s.toUpperCase(),
      };

      expect(csv.parseCsv(spec, data)).toEqual(["CELL"]);
    });

    it("should parse string primitive", () => {
      const spec = {
        src: "s_col",
        type: "string",
      };

      expect(csv.parseCsv(spec, data)).toEqual(["cell"]);
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
            xform: (n) => -n,
          },
        },
        type: "object",
        xform: (o) => ({ xformed: true, ...o }),
      };

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
            xform: (n) => -n,
          },
        },
        type: "object",
      };

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
        xform: (a) => new Set(a),
      };
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
      };
      const json = csv.parseCsv(spec, data);
      expect(json).toEqual([["cell", true]]);
    });

    it("should throw when src not specified", () => {
      const spec = {
        type: "boolean",
      };

      expect(() => csv.parseCsv(spec, data)).toThrow(
        `'src' not specified in spec: {"type":"boolean"}`,
      );
    });

    it("should throw when type not specified", () => {
      const spec = {
        src: "b_col",
      };

      expect(() => csv.parseCsv(spec, data)).toThrow(
        'Unknown type in spec: {"src":"b_col"}',
      );
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
