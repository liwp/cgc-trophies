import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import CONFIG from "trophies-config";
import CopyButton from "../components/CopyButton";
import ExpandButton from "../components/ExpandButton";
import FlightLinks from "../components/FlightLinks";
import FlightLoadFailure from "../components/FlightLoadFailure";
import HeightLossWarning from "../components/HeightLossWarning";
import Loading from "../components/Loading";
import PageLayout from "../components/PageLayout";
import Season from "../components/Season";
import Stats from "../components/Stats";
import Th from "../components/Th";
import {
  evaluateTrophy,
  formatScore,
  winnerFlights,
  winnerName,
  winnerScore,
} from "../lib/results";
import {
  flightCopyData,
  formatPilotName,
  ladderCopyData,
} from "../lib/trophyCopyData";
import { resolveTrophies } from "../lib/trophyHistory";
import useFlights from "../lib/useFlights";
import type { Flight, LadderResult, ScoredFlight, Trophy } from "../types";

const FlightResultEntry = ({
  result,
  rank,
}: {
  result: ScoredFlight;
  rank: number;
}) => {
  const { date, id, pilot, score, task } = result;
  const tps = [task.start, ...task.turnpoints, task.finish].join(" - ");
  const scoreDisplay = formatScore(score);

  return (
    <tr
      className={
        rank === 1 ? "bg-cambridge-light" : "hover:bg-gray-50 transition-colors"
      }
    >
      <td className="px-4 py-2 text-gray-500 text-sm">{rank}</td>
      <td className="px-4 py-2 text-gray-700">{formatPilotName(pilot)}</td>
      <td className="px-4 py-2 text-gray-700">{scoreDisplay}</td>
      <td className="px-4 py-2 text-gray-500 text-sm">
        {date.toLocaleDateString()}
      </td>
      <td className="px-4 py-2 text-gray-500 text-sm">{tps}</td>
      <td className="px-4 py-2">
        <div className="inline-flex items-center gap-1">
          <FlightLinks flightId={id} iconSize={14} />
          <HeightLossWarning
            flightId={id}
            reportedHeightLoss={task.heightLoss}
          />
          <CopyButton data={flightCopyData(result)} />
        </div>
      </td>
    </tr>
  );
};

const LadderFlightRow = ({ flight }: { flight: Flight }) => (
  <tr className="bg-gray-50">
    <td className="px-4 py-1.5" />
    <td className="px-4 py-1.5 text-gray-500 text-sm pl-10">
      {formatPilotName(flight.pilot)}
    </td>
    <td className="px-4 py-1.5 text-gray-500 text-sm">
      {formatScore({ value: flight.task.crossCountryPoints, unit: "pts" })}
    </td>
    <td className="px-4 py-1.5 text-gray-500 text-sm">
      {flight.date.toLocaleDateString()}
    </td>
    <td className="px-4 py-1.5" />
    <td className="px-4 py-1.5">
      <div className="inline-flex items-center gap-1">
        <FlightLinks flightId={flight.id} iconSize={14} inline />
        <HeightLossWarning
          flightId={flight.id}
          reportedHeightLoss={flight.task.heightLoss}
        />
      </div>
    </td>
  </tr>
);

const LadderResultEntry = ({
  result,
  rank,
  isSyndicate,
}: {
  result: LadderResult;
  rank: number;
  isSyndicate: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${rank === 1 ? "bg-cambridge-light" : "hover:bg-gray-50"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-2 text-gray-500 text-sm">{rank}</td>
        <td className="px-4 py-2 text-gray-700">
          <div className="inline-flex items-center gap-1">
            {isSyndicate
              ? `${result.key} (${result.pilots.map(formatPilotName).join(", ")})`
              : formatPilotName(result.key)}
            {result.flights.map((f) => (
              <HeightLossWarning
                key={f.id}
                flightId={f.id}
                reportedHeightLoss={f.task.heightLoss}
              />
            ))}
          </div>
        </td>
        <td className="px-4 py-2 text-gray-700">
          {formatScore({ value: result.totalScore, unit: "pts" })}
        </td>
        <td className="px-4 py-2 text-gray-500 text-sm">
          {result.flights.length} flights
        </td>
        <td className="px-4 py-2" />
        <td className="px-4 py-2">
          <div className="inline-flex items-center gap-1">
            <CopyButton
              data={ladderCopyData(
                result,
                isSyndicate ? "registration" : "pilot",
              )}
            />
            <ExpandButton
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
              label={`Flights for ${isSyndicate ? result.key : formatPilotName(result.key)}`}
              iconSize={14}
            />
          </div>
        </td>
      </tr>
      {expanded &&
        result.flights.map((flight) => (
          <LadderFlightRow key={flight.id} flight={flight} />
        ))}
    </>
  );
};

const TrophySection = ({
  trophy,
  flights,
  allFlights,
  season,
}: {
  trophy: Trophy;
  flights: Flight[];
  allFlights: Flight[];
  season: number;
}) => {
  const [showAll, setShowAll] = useState(false);
  // Re-scoring on every "Show all" toggle or row expand is wasted work.
  const evaluated = useMemo(
    () => evaluateTrophy(trophy, season, { flights, allFlights }),
    [trophy, season, flights, allFlights],
  );
  const isLadder = evaluated.type === "ladder";
  const isSyndicate =
    evaluated.type === "ladder" && evaluated.trophy.groupBy === "registration";
  const { results } = evaluated;

  const name = winnerName(evaluated);
  const winnerLabel = name
    ? `${name} — ${winnerScore(evaluated)}`
    : "No qualifying flights";

  return (
    <div id={`trophy-${trophy.id}`} className="scroll-mt-4">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{trophy.name}</h3>
          {winnerFlights(evaluated).map((f) => (
            <HeightLossWarning
              key={f.id}
              flightId={f.id}
              reportedHeightLoss={f.task.heightLoss}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 shrink-0">{winnerLabel}</span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{trophy.description}</p>

      {results.length > 0 && (
        <>
          <button
            type="button"
            className="text-sm text-cambridge hover:text-cambridge-dark transition-colors mb-2"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Hide results" : `Show all results (${results.length})`}
          </button>

          {showAll && (
            <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <Th compact>#</Th>
                    <Th compact>
                      {isLadder
                        ? isSyndicate
                          ? "Glider / Pilots"
                          : "Pilot"
                        : "Pilot"}
                    </Th>
                    <Th compact>Score</Th>
                    <Th compact>{isLadder ? "Flights" : "Date"}</Th>
                    {!isLadder && <Th compact>Task</Th>}
                    <Th compact />
                  </tr>
                </thead>
                <tbody>
                  {evaluated.type === "ladder"
                    ? evaluated.results.map((r, i) => (
                        <LadderResultEntry
                          key={r.key}
                          result={r}
                          rank={i + 1}
                          isSyndicate={isSyndicate}
                        />
                      ))
                    : evaluated.results.map((r, i) => (
                        <FlightResultEntry key={r.id} result={r} rank={i + 1} />
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AdminPage = () => {
  const state = useFlights();

  if (state.status === "error") return <FlightLoadFailure />;
  if (state.status === "loading") return <Loading />;
  const { season, flights, allFlights } = state;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/?season=${season}`}
              className="inline-flex items-center gap-1 text-cambridge hover:text-cambridge-dark transition-colors"
            >
              <ArrowLeft size={16} /> Public view
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {CONFIG.club.shortName} {season} Trophies — Admin
            </h1>
          </div>
          <Season season={season} />
        </div>

        <Stats flights={flights} season={season} />

        <nav className="flex flex-wrap gap-2">
          {CONFIG.trophies.map((t) => (
            <a
              key={t.id}
              href={`#trophy-${t.id}`}
              className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-cambridge hover:border-cambridge transition-colors"
            >
              {t.name}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-10">
          {resolveTrophies(season).map((trophy) => (
            <TrophySection
              key={trophy.id}
              trophy={trophy}
              flights={flights}
              allFlights={allFlights}
              season={season}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;
