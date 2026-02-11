import React from "react";
import Link from "next/link";
import { Heading, IconButton, Table, VStack } from "@chakra-ui/react";
import { Check, Copy } from "lucide-react";
import Tooltip from "../components/ui/Tooltip";

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
    <Tooltip content={copied ? "Copied!" : "Copy for spreadsheet"}>
      <IconButton
        aria-label="Copy to clipboard"
        size="xs"
        variant="ghost"
        colorPalette={copied ? "green" : "gray"}
        onClick={handleCopy}
      >
        {copied ? <Check /> : <Copy />}
      </IconButton>
    </Tooltip>
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
      <Table.Row>
        <Table.Cell>
          <Link href={`/trophy/${id}?season=${season}`}>{name}</Link>
        </Table.Cell>
        <Table.Cell>{winner}</Table.Cell>
        <Table.Cell width="24px" px={1}>
          {copyData && <CopyButton data={copyData} />}
        </Table.Cell>
      </Table.Row>
      {copyData && (
        <Table.Row>
          <Table.Cell colSpan={3} p={0}>
            <WinnerDetails flights={flights} flightDetail={flightDetail} />
          </Table.Cell>
        </Table.Row>
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
    <Table.ScrollArea minWidth="600px">
      <Table.Root size="md" variant="outline" striped>
        <Table.Caption>
          Cambridge Gliding Centre {season} Trophy Winners
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Trophy</Table.ColumnHeader>
            <Table.ColumnHeader>Winner</Table.ColumnHeader>
            <Table.ColumnHeader width="24px"></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {trophies.map((trophy) => (
            <TrophyWinner key={trophy.id} trophy={trophy} />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

const TrophiesPage = () => {
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  return (
    <VStack>
      <Season season={season} />
      <Heading size="xl">CGC {season} Trophies</Heading>
      <Stats flights={flights!} season={season} />
      <TrophyList flights={flights!} season={season} />
    </VStack>
  );
};

export default TrophiesPage;
