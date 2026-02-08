import React, { useState } from "react";
import { chain } from "lodash";
import Link from "next/link";
import {
  Heading,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

import TROPHIES from "../lib/cgc_trophies";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import Season from "../components/Season";
import Stats from "../components/Stats";
import WinnerDetails from "../components/WinnerDetails";
import { trophyEval, ladderEval } from "../lib/eval";
import { flightCopyData, ladderCopyData } from "../lib/trophyCopyData";
import useFlights from "../lib/useFlights";
import type { Flight, FlightTrophy, LadderTrophy, ScoredFlight, LadderResult } from "../types";

const TrophyWinner = ({ trophy }: { trophy: any }) => {
  const { id, name, results, season, type, groupBy } = trophy;
  const result = results[0];
  const [expanded, setExpanded] = useState(false);

  let winner: string;
  let copyData: [string, string][] | null = null;
  if (!result) {
    winner = "No qualifying flights";
  } else if (type === "ladder") {
    const lr = result as LadderResult;
    winner = groupBy === "registration"
      ? `${lr.key} (${lr.pilots.join(", ")})`
      : lr.key;
    copyData = ladderCopyData(lr, groupBy);
  } else {
    const sf = result as ScoredFlight;
    winner = sf.pilot;
    copyData = flightCopyData(sf);
  }

  return (
    <>
      <Tr
        cursor={copyData ? "pointer" : undefined}
        onClick={copyData ? () => setExpanded(!expanded) : undefined}
      >
        <Td>
          <Link href={`/trophy/${id}?season=${season}`}>{name}</Link>
        </Td>
        <Td>{winner}</Td>
        <Td width="24px" px={1}>
          {copyData && (expanded ? <ChevronUpIcon /> : <ChevronDownIcon />)}
        </Td>
      </Tr>
      {expanded && copyData && (
        <Tr>
          <Td colSpan={3} p={0}>
            <WinnerDetails data={copyData} />
          </Td>
        </Tr>
      )}
    </>
  );
};

const TrophyList = ({ flights, season }: { flights: Flight[]; season: number }) => {
  const trophies = TROPHIES.trophies.map((trophy) => {
    if (trophy.type === "ladder") {
      const results = ladderEval(TROPHIES.config, season, flights, trophy as LadderTrophy);
      return {
        ...trophy,
        results,
        groupBy: (trophy as LadderTrophy).groupBy,
        season,
      };
    } else {
      const results = chain(trophyEval(TROPHIES.config, season, flights, trophy as FlightTrophy))
        .filter((f: any) => !f.ignore)
        .value();
      return {
        ...trophy,
        results,
        season,
      };
    }
  });

  return (
    <TableContainer minWidth="600px">
      <Table size="md" variant="striped">
        <TableCaption>
          Cambridge Gliding Centre {season} Trophy Winners
        </TableCaption>
        <Thead>
          <Tr>
            <Th>Trophy</Th>
            <Th>Winner</Th>
            <Th width="24px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {trophies.map((trophy) => (
            <TrophyWinner key={trophy.id} trophy={trophy} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
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
