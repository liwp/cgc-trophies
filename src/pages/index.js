import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LinkBox,
  LinkOverlay,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

import TROPHIES from "../lib/cgc_trophies";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import Season from "../components/Season";
import Stats from "../components/Stats";
import { trophyEval } from "../lib/eval";
import useFlights from "../lib/useFlights";

// TODO: can we share a component with the trophy page for rendering the pilot?
// TODO: should we have a link to the BGA Ladder here?
const TrophyWinner = ({ trophy }) => {
  const { id, name, results, season } = trophy;
  const result = results[0];

  return (
    <LinkBox as={Tr}>
      <Td>
        <LinkOverlay as={Link} href={`/trophy/${id}?season=${season}`}>
          {name}
        </LinkOverlay>
      </Td>
      <Td>{!!result ? result.pilot : "No qualifying flights"}</Td>
    </LinkBox>
  );
};

const TrophyList = ({ flights, season }) => {
  const trophies = Object.values(TROPHIES.trophies).map((trophy) => ({
    ...trophy,
    results: trophyEval(TROPHIES.config, season, flights, trophy),
    season,
  }));

  return (
    <TableContainer>
      <Table size="sm" variant="simple">
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
            <TrophyWinner key={trophy.name} trophy={trophy} />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const TrophiesPage = () => {
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  // TODO: this should be in the layout
  if (isLoading) return <Loading />;

  return (
    <div>
      <Season season={season} />
      <Stats flights={flights} season={season} />
      <TrophyList flights={flights} season={season} />
    </div>
  );
};

export default TrophiesPage;
