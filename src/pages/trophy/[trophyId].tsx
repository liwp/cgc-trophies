import React, { useState } from "react";
import { keyBy, sample, uniqBy } from "lodash";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Center,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Link,
  Stack,
  StackDivider,
  Switch,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { ArrowBackIcon, ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from "@chakra-ui/icons";

import CGC_TROPHIES from "../../lib/cgc_trophies";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import Loading from "../../components/Loading";
import Season from "../../components/Season";
import UnknownTrophy from "../../components/UnknownTrophy";
import { trophyEval, ladderEval } from "../../lib/eval";
import useFlights from "../../lib/useFlights";
import { formatPilotName } from "../../lib/trophyCopyData";
import type { Flight, FlightTrophy, LadderTrophy, LadderResult, ScoredFlight, Trophy } from "../../types";

const CONFIG = CGC_TROPHIES.config;
const TROPHIES = keyBy(CGC_TROPHIES.trophies, "id");

const Score = ({ value, unit }: { value: number; unit: string }) => {
  let display: string;
  switch (unit) {
    case "km":
    case "kph":
      display = value.toFixed(1);
      break;
    case "pts":
      display = value.toFixed(0);
      break;
    default:
      display = String(value);
  }

  return (
    <span>
      {display} {unit}
    </span>
  );
};

const Task = ({ task }: { task: { start: string; turnpoints: string[]; finish: string } }) => {
  const tps = [task.start, ...task.turnpoints, task.finish];

  return <span>{tps.join(" - ")}</span>;
};

const Result = ({ result }: { result: ScoredFlight }) => {
  const {
    date,
    id,
    pilot,
    score: { unit, value },
    task,
  } = result;

  return (
    <Tr>
      <Td>{formatPilotName(pilot)}</Td>
      <Td>{date.toLocaleDateString()}</Td>
      <Td>
        <Score value={value} unit={unit} />
      </Td>
      <Td>
        <Task task={task} />
      </Td>
      <Td>
        <Center>
          <Link
            href={`https://www.bgaladder.net/flightdetails/${id}`}
            isExternal
          >
            <ExternalLinkIcon />
          </Link>
        </Center>
      </Td>
    </Tr>
  );
};

const ResultsList = ({ results, season, trophy }: { results: ScoredFlight[]; season: number; trophy: string }) => {
  const [unique, setUnique] = useState(true);

  const filtered = unique ? uniqBy(results, "pilot") : results;

  if (filtered.length === 0) {
    return (
      <Center>
        <Heading size="sm">No qualifying flights</Heading>
      </Center>
    );
  }

  return (
    <Box>
      <Box pb="20px">
        <Toggle
          id="unique"
          isChecked={unique}
          label="One flight per pilot?"
          onChange={() => setUnique(!unique)}
        />
      </Box>

      <TableContainer>
        <Table size="md" variant="striped">
          <TableCaption>
            {trophy} {season} Results
          </TableCaption>
          <Thead>
            <Tr>
              <Th>Pilot</Th>
              <Th>Date</Th>
              <Th>Score</Th>
              <Th>Task</Th>
              <Th>
                <Center>Ladder</Center>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((result) => (
              <Result key={result.id} result={result} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const LadderFlightRow = ({ flight }: { flight: Flight }) => {
  return (
    <Tr>
      <Td pl="40px">{formatPilotName(flight.pilot)}</Td>
      <Td>{flight.date.toLocaleDateString()}</Td>
      <Td>{flight.task.crossCountryPoints.toFixed(0)} pts</Td>
      <Td>
        <Center>
          <Link
            href={`https://www.bgaladder.net/flightdetails/${flight.id}`}
            isExternal
          >
            <ExternalLinkIcon />
          </Link>
        </Center>
      </Td>
    </Tr>
  );
};

const LadderResultRow = ({ result, rank, isSyndicate }: { result: LadderResult; rank: number; isSyndicate: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Tr
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Td>{rank}</Td>
        <Td>{isSyndicate ? result.key : formatPilotName(result.key)}</Td>
        {isSyndicate && <Td>{result.pilots.map(formatPilotName).join(", ")}</Td>}
        <Td>{result.totalScore.toFixed(0)} pts</Td>
        <Td>{result.flights.length}</Td>
        <Td>
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Td>
      </Tr>
      {expanded &&
        result.flights.map((flight) => (
          <LadderFlightRow key={flight.id} flight={flight} />
        ))}
    </>
  );
};

const LadderResultsList = ({
  results,
  season,
  trophy,
  isSyndicate,
}: {
  results: LadderResult[];
  season: number;
  trophy: string;
  isSyndicate: boolean;
}) => {
  if (results.length === 0) {
    return (
      <Center>
        <Heading size="sm">No qualifying flights</Heading>
      </Center>
    );
  }

  return (
    <TableContainer>
      <Table size="md" variant="striped">
        <TableCaption>
          {trophy} {season} Results
        </TableCaption>
        <Thead>
          <Tr>
            <Th>Rank</Th>
            <Th>{isSyndicate ? "Glider" : "Pilot"}</Th>
            {isSyndicate && <Th>Pilots</Th>}
            <Th>Score</Th>
            <Th>Flights</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {results.map((result, i) => (
            <LadderResultRow
              key={result.key}
              result={result}
              rank={i + 1}
              isSyndicate={isSyndicate}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const TrophyImage = ({ image }: { image?: string }) => {
  return !!image ? (
    <Image alt="trophy photo" borderRadius="5px" boxSize="150px" src={image} />
  ) : null;
};

const Toggle = ({
  id,
  label,
  onChange,
  isChecked,
}: {
  id: string;
  label: string;
  onChange: () => void;
  isChecked: boolean;
}) => {
  return (
    <FormControl display="flex" alignItems="center" justifyContent="flex-end">
      <FormLabel htmlFor={id} mb="0">
        {label}
      </FormLabel>
      <Switch id={id} isChecked={isChecked} onChange={onChange} size="sm" />
    </FormControl>
  );
};

const AllTrophies = ({ season }: { season: number }) => {
  return (
    <Box display="flex" alignItems="center">
      <Link as={NextLink} href={`/?season=${season}`}>
        <ArrowBackIcon /> <Text as="span">All Trophies</Text>
      </Link>
    </Box>
  );
};

const TrophyPage = () => {
  const router = useRouter();
  const trophyId = router.query.trophyId as string;
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  const config = TROPHIES[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  const isLadder = config.type === "ladder";

  return (
    <Card variant="outline">
      <AllTrophies season={season} />

      <CardHeader display="flex" alignItems="center">
        <Heading size="md" flex="1">
          {config.name}
        </Heading>
        <Season season={season} />
      </CardHeader>

      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <TrophyImage image={sample(config.img)} />
            <Text pt="2" fontSize="sm">
              {config.description}
            </Text>
          </Box>

          {isLadder ? (
            <LadderResultsList
              results={ladderEval(CONFIG, season, flights!, config as LadderTrophy)}
              season={season}
              trophy={config.name}
              isSyndicate={(config as LadderTrophy).groupBy === "registration"}
            />
          ) : (
            <ResultsList
              results={trophyEval(CONFIG, season, flights!, config as FlightTrophy)}
              season={season}
              trophy={config.name}
            />
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default TrophyPage;
