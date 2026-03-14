import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import config from "../../../trophies.config";
import { parseCsv } from "./csv";
import { SPEC } from "./flightCsvSpec";

function parseFlights(csv: string) {
  return parseCsv(SPEC, csv);
}

const URL = `https://api.bgaladder.net/api/getlogfilescsv`;

const CLUB = config.club.code;

async function getFlights(req: NextApiRequest, res: NextApiResponse) {
  const start = parseInt(req.query.start as string);
  const end = parseInt(req.query.end as string);
  if (isNaN(start) || isNaN(end)) {
    res.status(400).json({
      error: `missing query params: ${isNaN(start) ? "start" : "end"}`,
    });
    return;
  }

  const years = Array(end - start + 1)
    .fill(null)
    .map((_, i) => start + i);

  const responses = years.map((year) => {
    return axios.get(`${URL}/${year}/${CLUB}`);
  });

  const flights = (await Promise.all(responses))
    .map(({ data }) => parseFlights(data))
    .flat();

  console.log("ALL flights", flights.length);

  if (end < new Date().getFullYear()) {
    res.setHeader("Cache-Control", "max-age=31536000");
  } else {
    res.setHeader("Cache-Control", "max-age=60, stale-while-revalidate=240");
  }
  res.status(200).json({ club: CLUB, start, end, flights });
}

export default getFlights;
