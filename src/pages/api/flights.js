const axios = require("axios");

const { parseCsv } = require("./csv");
const { SPEC } = require("./flightCsvSpec");

function parseFlights(csv) {
  return parseCsv(SPEC, csv);
}

const URL = `https://api.bgaladder.net/api/getlogfilescsv`;

// TODO: pull from env var, or something?
const CLUB = "CAM";

async function getFlights(req, res) {
  const start = parseInt(req.query.start);
  const end = parseInt(req.query.end);
  if (isNaN(start) || isNaN(end)) {
    res.status(400).json({
      error: `missing query params: ${isNaN(start) ? "start" : "end"}`,
    });
    return;
  }

  const years = Array(end - start + 1)
    .fill()
    .map((_, i) => start + i);

  const responses = years.map((year) => {
    return axios.get(`${URL}/${year}/${CLUB}`);
  });

  const flights = (await Promise.all(responses))
    .map(({ data }) => parseFlights(data))
    .flat();

  console.log("ALL flights", flights.length);

  // Set cache headers - cache
  if (end < new Date().getFullYear()) {
    // Cache requests for historical seasons 'forever' (for 1 year)
    res.setHeader("Cache-Control", "max-age=31536000");
  } else {
    // Cache this season temporarily
    res.setHeader("Cache-Control", "max-age=60, stale-while-revalidate=240");
  }
  res.status(200).json({ club: CLUB, start, end, flights });
}

export default getFlights;
