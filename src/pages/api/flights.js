const axios = require("axios");

const { parseCsv } = require("./csv");
const { SPEC } = require("./flightCsvSpec");

function parseFlights(csv) {
  return parseCsv(SPEC, csv);
}

const URL = `https://www.bgaladder.net/Steward/GetLogFilesCSV`;

// TODO: pull from env var, or something?
const CLUB = "CAM";

export default async (req, res) => {
  const { start, end } = req.query;
  const startDate = new Date(start);
  const endDate = new Date(end);

  const years = Array(endDate.getFullYear() - startDate.getFullYear() + 1)
    .fill()
    .map((_, i) => startDate.getFullYear() + i);

  console.log("REQ", startDate, endDate, years);

  const responses = years.map((year) => {
    const params = { clubID: CLUB, Season: year };
    console.log("GET", URL, params);
    return axios.get(URL, { params });
  });

  const flights = (await Promise.all(responses))
    .map(({ data }) => parseFlights(data))
    .flat();

  console.log("ALL flights", flights.length);

  const fs = flights.filter(({ date }) => startDate <= date && date < endDate);

  console.log("FILTERED flights", fs.length);

  res.status(200).json({ club: CLUB, start, end, flights: fs });
};
