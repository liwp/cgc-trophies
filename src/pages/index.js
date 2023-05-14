import React from "react";
import { chain } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Heading,
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
  VStack,
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
  const trophies = Object.values(TROPHIES.trophies).map((trophy) => {
    const results = chain(trophyEval(TROPHIES.config, season, flights, trophy))
      .filter(({ ignore }) => !ignore)
      .value();

    return {
      ...trophy,
      results,
      season,
    };
  });

  return (
    // TODO: Make the container a bit wider, but I think we want to change the
    // layout in general.
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
    <VStack>
      <Season season={season} />
      <Heading size="xl">CGC {season} Trophies</Heading>
      <Stats flights={flights} season={season} />
      <TrophyList flights={flights} season={season} />
    </VStack>
  );
};

export default TrophiesPage;
