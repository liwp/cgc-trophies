import React from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

import TROPHIES from "../lib/cgc_trophies";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import Season from "../components/Season";
import Stats from "../components/Stats";
import WinnerDetails from "../components/WinnerDetails";
import { trophyEval, ladderEval } from "../lib/eval";
import {
  copyDataToClipboard,
  flightCopyData,
  flightFlightDetails,
  formatPilotName,
  ladderCopyData,
  ladderFlightDetails,
} from "../lib/trophyCopyData";
import type { FlightDetail, SingleFlightDetail } from "../lib/trophyCopyData";
import useFlights from "../lib/useFlights";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  ScoredFlight,
  LadderResult,
} from "../types";

const CopyButton = ({ data }: { data: [string, string][] }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyDataToClipboard(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      aria-label="Copy to clipboard"
      className={`p-1 rounded hover:bg-gray-100 ${copied ? "text-green-600" : "text-gray-500"}`}
      title={copied ? "Copied!" : "Copy for spreadsheet"}
      onClick={handleCopy}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

const TrophyWinner = ({ trophy }: { trophy: any }) => {
  const { id, name, results, season, type, groupBy } = trophy;
  const result = results[0];

  let winner: string;
  let copyData: [string, string][] | null = null;
  let flights: FlightDetail[] | undefined;
  let flightDetail: SingleFlightDetail | undefined;
  if (!result) {
    winner = "No qualifying flights";
  } else if (type === "ladder") {
    const lr = result as LadderResult;
    winner =
      groupBy === "registration"
        ? `${lr.key} (${lr.pilots.map(formatPilotName).join(", ")})`
        : formatPilotName(lr.key);
    copyData = ladderCopyData(lr, groupBy);
    flights = ladderFlightDetails(lr);
  } else {
    const sf = result as ScoredFlight;
    winner = formatPilotName(sf.pilot);
    copyData = flightCopyData(sf);
    flightDetail = flightFlightDetails(sf);
  }

  return (
    <>
      <tr>
        <td className="p-2">
          <Link href={`/trophy/${id}?season=${season}`}>{name}</Link>
        </td>
        <td className="p-2">{winner}</td>
        <td className="w-6 px-1">
          {copyData && <CopyButton data={copyData} />}
        </td>
      </tr>
      {copyData && (
        <tr>
          <td colSpan={3} className="p-0">
            <WinnerDetails flights={flights} flightDetail={flightDetail} />
          </td>
        </tr>
      )}
    </>
  );
};

const TrophyList = ({
  flights,
  season,
}: {
  flights: Flight[];
  season: number;
}) => {
  const trophies = TROPHIES.trophies.map((trophy) => {
    if (trophy.type === "ladder") {
      const results = ladderEval(
        TROPHIES.config,
        season,
        flights,
        trophy as LadderTrophy,
      );
      return {
        ...trophy,
        results,
        groupBy: (trophy as LadderTrophy).groupBy,
        season,
      };
    } else {
      const results = trophyEval(
        TROPHIES.config,
        season,
        flights,
        trophy as FlightTrophy,
      ).filter((f: any) => !f.ignore);
      return {
        ...trophy,
        results,
        season,
      };
    }
  });

  return (
    <div className="min-w-[600px] overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <caption className="caption-bottom py-2 text-sm text-gray-500">
          Cambridge Gliding Centre {season} Trophy Winners
        </caption>
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left font-semibold">Trophy</th>
            <th className="p-2 text-left font-semibold">Winner</th>
            <th className="w-6"></th>
          </tr>
        </thead>
        <tbody>
          {trophies.map((trophy, i) => (
            <TrophyWinner key={trophy.id} trophy={trophy} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TrophiesPage = () => {
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-col items-center gap-4">
      <Season season={season} />
      <h1 className="text-2xl font-bold">CGC {season} Trophies</h1>
      <Stats flights={flights!} season={season} />
      <TrophyList flights={flights!} season={season} />
    </div>
  );
};

export default TrophiesPage;
