import { identity, zipObject } from "lodash";
import Papa from "papaparse";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseBoolean(val: string): boolean {
  return val.toLowerCase() === "true" || val === "1";
}

function parseDate(val: string): Date {
  const match = val.match(/^(\d{2})-(...)-(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid date format: ${val}`);
  }

  const [day, monthName, year] = match.slice(1);
  if (parseInt(day, 10) > 31) {
    throw new Error(`Invalid date format: ${val}`);
  }
  const month = MONTHS.indexOf(monthName);
  if (month === -1) {
    throw new Error(`Invalid date format: ${val}`);
  }

  return new Date(Date.UTC(parseInt(year, 10), month, parseInt(day, 10)));
}

function parseNumber(val: string): number {
  if (val === "") {
    return 0;
  }
  if (!val.match(/^[+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?$/)) {
    throw new Error(`Invalid number format: ${val}`);
  }
  return parseFloat(val);
}

type LeafType = "boolean" | "date" | "number" | "string";

interface LeafValues {
  boolean: boolean;
  date: Date;
  number: number;
  string: string;
}

/**
 * How to build a value from a CSV row: a leaf reads one column (`src`) as its
 * `type`; an object or array builds each field or element from its own spec.
 * `xform` post-processes the parsed value.
 */
export type FieldSpec =
  | {
      [T in LeafType]: {
        type: T;
        src: string;
        xform?: (value: LeafValues[T]) => unknown;
      };
    }[LeafType]
  | {
      type: "object";
      src: Record<string, FieldSpec>;
      // Typed by each spec's own xform parameter.
      xform?: (value: any) => unknown;
    }
  | {
      type: "array";
      src: readonly FieldSpec[];
      // Typed by each spec's own xform parameter.
      xform?: (value: any) => unknown;
    };

/** The value a spec parses to, so parsed rows are type-checked. */
export type SpecOutput<S> = S extends { xform: (value: never) => infer R }
  ? R
  : S extends { type: LeafType }
    ? LeafValues[S["type"]]
    : S extends { type: "object"; src: infer O }
      ? { -readonly [K in keyof O]: SpecOutput<O[K]> }
      : S extends { type: "array"; src: readonly (infer E)[] }
        ? SpecOutput<E>[]
        : never;

/** Every CSV column a spec reads. */
function specColumns(spec: FieldSpec): string[] {
  if (spec.type === "object")
    return Object.values(spec.src).flatMap(specColumns);
  if (spec.type === "array") return spec.src.flatMap(specColumns);
  // Malformed specs are reported by parseSpec.
  return typeof spec.src === "string" ? [spec.src] : [];
}

function parseCsv<S extends FieldSpec>(spec: S, csv: string): SpecOutput<S>[] {
  const [headers = [], ...data] = Papa.parse(csv.trim()).data as string[][];
  if (data.length > 0 || headers.length > 0) {
    const present = new Set(headers);
    const missing = [...new Set(specColumns(spec))].filter(
      (column) => !present.has(column),
    );
    if (missing.length > 0) {
      throw new Error(
        `Missing CSV column${missing.length > 1 ? "s" : ""} ${missing.map((c) => `"${c}"`).join(", ")}`,
      );
    }
  }
  return data.map((row) => {
    const obj = zipObject(headers, row);
    return parseSpec(spec, obj) as SpecOutput<S>;
  });
}

// Untyped so that malformed specs (e.g. from untyped callers) fail with a
// clear message rather than an obscure one.
function parseSpec(spec: any, obj: Record<string, string>): any {
  const { src, type, xform = identity } = spec;
  if (src === undefined) {
    throw Error(`'src' not specified in spec: ${JSON.stringify(spec)}`);
  }

  let val: any;
  switch (type) {
    case "boolean":
      val = parseBoolean(obj[src]);
      break;
    case "date":
      val = parseDate(obj[src]);
      break;
    case "number":
      val = parseNumber(obj[src]);
      break;
    case "object":
      val = Object.entries(src).reduce(
        (acc: Record<string, any>, [key, subspec]) => {
          acc[key] = parseSpec(subspec, obj);
          return acc;
        },
        {},
      );
      break;
    case "array":
      val = (src as any[]).map((s) => parseSpec(s, obj));
      break;
    case "string":
      // BGA data has had stray whitespace, e.g. "Landen, George ".
      val = obj[src]?.trim();
      break;
    default:
      throw new Error(`Unknown type in spec: ${JSON.stringify(spec)}`);
  }

  return xform(val);
}

export { parseBoolean, parseCsv, parseDate, parseNumber };
