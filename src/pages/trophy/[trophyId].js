import { keyBy, sample, take, uniqBy } from "lodash";
import { useRouter } from "next/router";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Center,
  Heading,
  Image,
  Link,
  Stack,
  StackDivider,
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
import { ExternalLinkIcon } from "@chakra-ui/icons";

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
  // TODO: don't render Task for fixed task trophies? I think it's ok to render
  // this, eg the pilot could've flown the task the opposite way round.

  return (
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
  );
};

const TrophyImage = ({ image }) => {
  return !!image ? (
    <Image alt="trophy photo" borderRadius="5px" boxSize="150px" src={image} />
  ) : null;
};

const TrophyPage = () => {
  const router = useRouter();
  const trophyId = router.query.trophyId;
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  const config = TROPHIES[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  // Take the first 50 flights - avoids long lists on trophies like the Jubilee Bowl
  const results = take(trophyEval(CONFIG, season, flights, config), 50);

  // TODO: do we want uniqBy(results, 'pilot').map(...) here? OTOH multiple
  // results is annoying, but sometimes the first flight might be disqualified,
  // so we'd want to see the others too...

  return (
    <Card variant="outline">
      <CardHeader>
        <Heading size="md">{config.name}</Heading>
      </CardHeader>

      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <TrophyImage image={sample(config.img)} />
            <Text pt="2" fontSize="sm">
              {config.description}
            </Text>
          </Box>
          <Box>
            <ResultsList
              results={results}
              season={season}
              trophy={config.name}
            />
          </Box>
        </Stack>
      </CardBody>
    </Card>

    // <VStack>
    //   <Season season={season} />
    //   <Heading size="xl">{config.name}</Heading>
    //   <TrophyImage image={sample(config.img)} />
    //   <Card>
    //     <CardBody>
    //       <Text>{config.description}</Text>
    //     </CardBody>
    //   </Card>
    //   <Heading size="lg">Results</Heading>
    //   <ResultsList results={results} season={season} trophy={config.name} />
    // </VStack>
  );
};

export default TrophyPage;
