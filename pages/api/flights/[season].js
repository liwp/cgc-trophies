const axios = require("axios");

const URL = `https://www.bgaladder.net/Steward/GetLogFilesCSV`;

// TODO: some validation:
// - min season - 2016
// - max season (current season)

// TODO: pull from env var, or something?
const CLUB = "CAM";

export default async (req, res) => {
  const season = req.query.season || new Date().getFullYear();
  const params = { clubID: CLUB, Season: season };
  const response = await axios.get(URL, { params });
  const data = response.data;

  res.status(200).json({ club: CLUB, season, data });
};
