import React, { useState } from "react";
import { keyBy, sample, uniqBy } from "lodash";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  Box,
  Card,
  Center,
  Field,
  Heading,
  Image,
  Link,
  Separator,
  Stack,
  Switch,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

import CGC_TROPHIES from "../../lib/cgc_trophies";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import Loading from "../../components/Loading";
import Season from "../../components/Season";
import UnknownTrophy from "../../components/UnknownTrophy";
import { trophyEval, ladderEval } from "../../lib/eval";
import useFlights from "../../lib/useFlights";
import { formatPilotName } from "../../lib/trophyCopyData";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  ScoredFlight,
  Trophy,
} from "../../types";

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

const Task = ({
  task,
}: {
  task: { start: string; turnpoints: string[]; finish: string };
}) => {
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
    <Table.Row>
      <Table.Cell>{formatPilotName(pilot)}</Table.Cell>
      <Table.Cell>{date.toLocaleDateString()}</Table.Cell>
      <Table.Cell>
        <Score value={value} unit={unit} />
      </Table.Cell>
      <Table.Cell>
        <Task task={task} />
      </Table.Cell>
      <Table.Cell>
        <Center>
          <Link
            href={`https://www.bgaladder.net/flightdetails/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
          </Link>
        </Center>
      </Table.Cell>
    </Table.Row>
  );
};

const ResultsList = ({
  results,
  season,
  trophy,
}: {
  results: ScoredFlight[];
  season: number;
  trophy: string;
}) => {
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
          checked={unique}
          label="One flight per pilot?"
          onChange={() => setUnique(!unique)}
        />
      </Box>

      <Table.ScrollArea>
        <Table.Root size="md" variant="outline" striped>
          <Table.Caption>
            {trophy} {season} Results
          </Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Pilot</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Score</Table.ColumnHeader>
              <Table.ColumnHeader>Task</Table.ColumnHeader>
              <Table.ColumnHeader>
                <Center>Ladder</Center>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtered.map((result) => (
              <Result key={result.id} result={result} />
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
};

const LadderFlightRow = ({ flight }: { flight: Flight }) => {
  return (
    <Table.Row>
      <Table.Cell pl="40px">{formatPilotName(flight.pilot)}</Table.Cell>
      <Table.Cell>{flight.date.toLocaleDateString()}</Table.Cell>
      <Table.Cell>{flight.task.crossCountryPoints.toFixed(0)} pts</Table.Cell>
      <Table.Cell>
        <Center>
          <Link
            href={`https://www.bgaladder.net/flightdetails/${flight.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
          </Link>
        </Center>
      </Table.Cell>
    </Table.Row>
  );
};

const LadderResultRow = ({
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
      <Table.Row cursor="pointer" onClick={() => setExpanded(!expanded)}>
        <Table.Cell>{rank}</Table.Cell>
        <Table.Cell>
          {isSyndicate ? result.key : formatPilotName(result.key)}
        </Table.Cell>
        {isSyndicate && (
          <Table.Cell>
            {result.pilots.map(formatPilotName).join(", ")}
          </Table.Cell>
        )}
        <Table.Cell>{result.totalScore.toFixed(0)} pts</Table.Cell>
        <Table.Cell>{result.flights.length}</Table.Cell>
        <Table.Cell>{expanded ? <ChevronUp /> : <ChevronDown />}</Table.Cell>
      </Table.Row>
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
    <Table.ScrollArea>
      <Table.Root size="md" variant="outline" striped>
        <Table.Caption>
          {trophy} {season} Results
        </Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Rank</Table.ColumnHeader>
            <Table.ColumnHeader>
              {isSyndicate ? "Glider" : "Pilot"}
            </Table.ColumnHeader>
            {isSyndicate && <Table.ColumnHeader>Pilots</Table.ColumnHeader>}
            <Table.ColumnHeader>Score</Table.ColumnHeader>
            <Table.ColumnHeader>Flights</Table.ColumnHeader>
            <Table.ColumnHeader></Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {results.map((result, i) => (
            <LadderResultRow
              key={result.key}
              result={result}
              rank={i + 1}
              isSyndicate={isSyndicate}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
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
  checked,
}: {
  id: string;
  label: string;
  onChange: () => void;
  checked: boolean;
}) => {
  return (
    <Field.Root display="flex" alignItems="center" justifyContent="flex-end">
      <Field.Label htmlFor={id} mb="0">
        {label}
      </Field.Label>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        size="sm"
      >
        <Switch.Thumb />
      </Switch.Root>
    </Field.Root>
  );
};

const AllTrophies = ({ season }: { season: number }) => {
  return (
    <Box display="flex" alignItems="center">
      <Link asChild>
        <NextLink href={`/?season=${season}`}>
          <ArrowLeft /> <Text as="span">All Trophies</Text>
        </NextLink>
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
    <Card.Root variant="outline">
      <AllTrophies season={season} />

      <Card.Header display="flex" alignItems="center">
        <Heading size="md" flex="1">
          {config.name}
        </Heading>
        <Season season={season} />
      </Card.Header>

      <Card.Body>
        <Stack gap="4">
          <Separator />
          <Box>
            <TrophyImage image={sample(config.img)} />
            <Text pt="2" fontSize="sm">
              {config.description}
            </Text>
          </Box>

          <Separator />
          {isLadder ? (
            <LadderResultsList
              results={ladderEval(
                CONFIG,
                season,
                flights!,
                config as LadderTrophy,
              )}
              season={season}
              trophy={config.name}
              isSyndicate={(config as LadderTrophy).groupBy === "registration"}
            />
          ) : (
            <ResultsList
              results={trophyEval(
                CONFIG,
                season,
                flights!,
                config as FlightTrophy,
              )}
              season={season}
              trophy={config.name}
            />
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

export default TrophyPage;
