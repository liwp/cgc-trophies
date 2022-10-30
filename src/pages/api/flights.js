const axios = require("axios");

const { parseCsv } = require("./csv");
const { SPEC } = require("./flightCsvSpec");

function parseFlights(csv) {
  return parseCsv(SPEC, csv);
}

const URL = `https://www.bgaladder.net/Steward/GetLogFilesCSV`;
//const URL = `https://staging.bgaladder.net/Steward/GetLogFilesCSV`;

// TODO: pull from env var, or something?
const CLUB = "CAM";

export default async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400).json({ error: "missing query params: start or end" });
    return;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const years = Array(endYear - startYear + 1)
    .fill()
    .map((_, i) => startYear + i);

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

  // Set cache headers - cache
  if (endYear < new Date().getFullYear()) {
    // Cache requests for historical seasons 'forever' (for 1 year)
    res.setHeader("Cache-Control", "max-age=31536000");
  } else {
    // Cache this season temporarily
    res.setHeader("Cache-Control", "max-age=60, stale-while-revalidate=240");
  }
  res.status(200).json({ club: CLUB, start, end, flights: fs });
};
