const Papa = require("papaparse");
const { identity, zipObject } = require("lodash");

function parseBoolean(val) {
  return val.toLowerCase() === "true" || val === "1";
}

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

function parseDate(val) {
  const match = val.match(/^(\d{2})-(...)-(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid date format: ${val}`);
  }

  const [day, monthName, year] = match.slice(1);
  if (day > 31) {
    throw new Error(`Invalid date format: ${val}`);
  }
  const month = MONTHS.indexOf(monthName);
  if (month === -1) {
    throw new Error(`Invalid date format: ${val}`);
  }

  return new Date(Date.UTC(year, month, day));
}

function parseNumber(val) {
  if (val === "") {
    return 0;
  }
  if (!val.match(/^[+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?$/)) {
    throw new Error(`Invalid number format: ${val}`);
  }
  return parseFloat(val);
}

function parseSpec(obj, spec) {
  try {
    // Array spec
    if (Array.isArray(spec)) {
      return spec.map((s) => parseSpec(obj, s)).filter((x) => x !== undefined);
    }

    if (typeof spec !== "object") {
      throw new Error(`spec must be an object or array - got: ${typeof spec}`);
    }

    const { header, type, xform } = spec;

    // Object spec
    if (!header) {
      return Object.entries(spec).reduce((acc, [key, subspec]) => {
        acc[key] = parseSpec(obj, subspec);
        return acc;
      }, {});
    }

    // Primitive spec
    let fn;
    switch (type) {
      case "boolean":
        fn = parseBoolean;
        break;
      case "date":
        fn = parseDate;
        break;
      case "number":
        fn = parseNumber;
        break;
      default:
        fn = xform || identity;
        break;
    }

    const cell = obj[header];
    if (cell === undefined) {
      throw new Error(`Cell with key ${header} is undefined`);
    }
    return fn(cell);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("parseSpec", e.stack, spec, obj);
    throw e;
  }
}

function parseCsv(csv, spec) {
  const [headers, ...data] = Papa.parse(csv.trim()).data;
  return data.map((row) => {
    const obj = zipObject(headers, row);
    return parseSpec(obj, spec);
  });
}

module.exports = {
  parseCsv,
  parseBoolean,
  parseDate,
  parseNumber,
};
