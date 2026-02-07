import React from "react";
import { chain } from "lodash";
import Link from "next/link";
import {
  Heading,
  LinkBox,
  LinkOverlay,
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

import TROPHIES from "../lib/cgc_trophies";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import Season from "../components/Season";
import Stats from "../components/Stats";
import { trophyEval, ladderEval } from "../lib/eval";
import useFlights from "../lib/useFlights";
import type { Flight, Trophy, FlightTrophy, LadderTrophy, ScoredFlight, LadderResult } from "../types";

const TrophyWinner = ({ trophy }: { trophy: any }) => {
  const { id, name, results, season, type, groupBy } = trophy;
  const result = results[0];

  let winner: string;
  if (!result) {
    winner = "No qualifying flights";
  } else if (type === "ladder") {
    const lr = result as LadderResult;
    winner = groupBy === "registration"
      ? `${lr.key} (${lr.pilots.join(", ")})`
      : lr.key;
  } else {
    winner = (result as ScoredFlight).pilot;
  }

  return (
    <LinkBox as={Tr}>
      <Td>
        <LinkOverlay as={Link} href={`/trophy/${id}?season=${season}`}>
          {name}
        </LinkOverlay>
      </Td>
      <Td>{winner}</Td>
    </LinkBox>
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
