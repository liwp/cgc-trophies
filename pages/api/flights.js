const axios = require("axios");

const URL = `https://www.bgaladder.net/Steward/GetLogFilesCSV`;

export default async (req, res) => {
  const [club, season] = req.query.param || [];
  const params = { clubID: club, Season: season };
  console.log("P", { params });
  const response = await axios.get(URL, { params });
  const data = response.data;

  res.status(200).json({ season, club, data });
};
