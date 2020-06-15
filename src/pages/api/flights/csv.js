const Papa = require("papaparse");
const { identity, zipObject } = require("lodash");

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

function parseBoolean(val) {
  return val.toLowerCase() === "true" || val === "1";
}

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

function parseCsv(spec, csv) {
  const [headers, ...data] = Papa.parse(csv.trim()).data;
  return data.map((row) => {
    const obj = zipObject(headers, row);
    return parseSpec(spec, obj);
  });
}

function parseSpec(spec, obj) {
  const { src, type, xform = identity } = spec;
  if (src === undefined) {
    throw Error(`'src' not specified in spec: ${JSON.stringify(spec)}`);
  }

  let val;
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
      val = Object.entries(src).reduce((acc, [key, subspec]) => {
        acc[key] = parseSpec(subspec, obj);
        return acc;
      }, {});
      break;
    case "array":
      val = src.map((s) => parseSpec(s, obj));
      break;
    case "string":
      val = obj[src];
      break;
    default:
      throw new Error(`Unknown type in spec: ${JSON.stringify(spec)}`);
      break;
  }

  return xform(val);
}

module.exports = {
  parseCsv,
  parseBoolean,
  parseDate,
  parseNumber,
};
