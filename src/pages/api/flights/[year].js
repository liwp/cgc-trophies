const axios = require("axios");

const { parseCsv } = require("./csv");
const { parseFlights } = require("./flights");

const URL = `https://www.bgaladder.net/Steward/GetLogFilesCSV`;

// TODO: some validation:
// - min season - 2016
// - max season (current season)

// TODO: pull from env var, or something?
const CLUB = "CAM";

export default async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const params = { clubID: CLUB, Season: year };

  console.log("GET", URL, params);

  const response = await axios.get(URL, { params });
  const flights = parseFlights(response.data);

  res.status(200).json({ club: CLUB, year, flights });
};
