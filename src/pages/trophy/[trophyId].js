import React, { useState } from "react";
import { chain, keyBy, sample, take, uniqBy } from "lodash";
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
  Tfoot,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { ArrowBackIcon, ExternalLinkIcon } from "@chakra-ui/icons";

import CGC_TROPHIES from "../../lib/cgc_trophies";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import Loading from "../../components/Loading";
import Season from "../../components/Season";
import UnknownTrophy from "../../components/UnknownTrophy";
import { trophyEval } from "../../lib/eval";
import useFlights from "../../lib/useFlights";

const CONFIG = CGC_TROPHIES.config;
const TROPHIES = keyBy(CGC_TROPHIES.trophies, "id");

const Score = ({ value, unit }) => {
  switch (unit) {
    case "km":
    case "kph":
      value = value.toFixed(1);
      break;
    case "pts":
      value = value.toFixed(0);
  }

  return (
    <span>
      {value} {unit}
    </span>
  );
};

const Task = ({ task }) => {
  const tps = [task.start, ...task.turnpoints, task.finish];

  return <span>{tps.join(" - ")}</span>;
};

const Result = ({ result }) => {
  const {
    date,
    id,
    pilot,
    score: { unit, value },
    task,
  } = result;

  return (
    <Tr>
      <Td>{pilot}</Td>
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

const ResultsList = ({ results, season, trophy }) => {
  const [unique, setUnique] = useState(true);

  results = unique ? uniqBy(results, "pilot") : results;

  if (results.length === 0) {
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
            {results.map((result) => (
              <Result key={result.id} result={result} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const TrophyImage = ({ image }) => {
  return !!image ? (
    <Image alt="trophy photo" borderRadius="5px" boxSize="150px" src={image} />
  ) : null;
};

const Toggle = ({ id, label, onChange, isChecked }) => {
  return (
    <FormControl display="flex" alignItems="center" justifyContent="flex-end">
      <FormLabel htmlFor={id} mb="0">
        {label}
      </FormLabel>
      <Switch id={id} isChecked={isChecked} onChange={onChange} size="sm" />
    </FormControl>
  );
};

const AllTrophies = ({ season }) => {
  return (
    <Box display="flex" alignItems="center">
      <Link as={NextLink} href={`/?season=${season}`}>
        <ArrowBackIcon /> <Text as="span">All Trophies</Text>
      </Link>
    </Box>
  );
};

// TODO: split into i) Layout (without loading errors etc) and ii) trophy table
const TrophyPage = () => {
  const router = useRouter();
  const trophyId = router.query.trophyId;
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  const config = TROPHIES[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  let results = trophyEval(CONFIG, season, flights, config);

  // TODO: shouldn't really be a Card...
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

          <ResultsList results={results} season={season} trophy={config.name} />
        </Stack>
      </CardBody>
    </Card>
  );
};

export default TrophyPage;
