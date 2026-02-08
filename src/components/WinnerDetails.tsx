import React from "react";
import {
  Box,
  HStack,
  IconButton,
  Link,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from "@chakra-ui/react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, ViewIcon } from "@chakra-ui/icons";
import { copyDataToClipboard } from "../lib/trophyCopyData";
import type { FlightDetail, SingleFlightDetail } from "../lib/trophyCopyData";

const FlightTable = ({ flights }: { flights: FlightDetail[] }) => (
  <Table size="sm" variant="unstyled">
    <Thead>
      <Tr>
        <Th px={1}>Pilot</Th>
        <Th px={1}>Date</Th>
        <Th px={1} isNumeric>Pts</Th>
        <Th px={1} isNumeric>Dist</Th>
        <Th px={1} isNumeric>Speed (HC)</Th>
        <Th px={1}>Task</Th>
        <Th px={1}></Th>
      </Tr>
    </Thead>
    <Tbody>
      {flights.map((f) => (
        <Tr key={f.ladderUrl}>
          <Td px={1} fontSize="xs">{f.pilot}</Td>
          <Td px={1} fontSize="xs">{f.date.toLocaleDateString()}</Td>
          <Td px={1} fontSize="xs" isNumeric>{f.points.toFixed(0)}</Td>
          <Td px={1} fontSize="xs" isNumeric>{f.distanceKm.toFixed(0)} km</Td>
          <Td px={1} fontSize="xs" isNumeric>{f.speedKph.toFixed(1)} kph</Td>
          <Td px={1} fontSize="xs">{f.task}</Td>
          <Td px={1} fontSize="xs">
            <HStack spacing={1}>
              <Link href={f.ladderUrl} isExternal onClick={(e) => e.stopPropagation()}>
                <ExternalLinkIcon />
              </Link>
              <Link href={f.igcUrl} isExternal onClick={(e) => e.stopPropagation()}>
                <ViewIcon />
              </Link>
            </HStack>
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

const FlightSummary = ({ flight }: { flight: SingleFlightDetail }) => {
  const { score } = flight;
  const isDistanceScore = score.unit === "km";
  const isSpeedScore = score.unit === "kph";
  const isPtsScore = score.unit === "pts";

  return (
    <HStack spacing={1} flexWrap="wrap" fontSize="xs">
      <Text>{flight.date.toLocaleDateString()}</Text>
      <Text color="gray.500">·</Text>
      <Text>{flight.gliderType} ({flight.gliderReg})</Text>
      <Text color="gray.500">·</Text>
      <Tooltip label="Handicapped distance" fontSize="xs">
        <Text fontWeight={isDistanceScore ? "bold" : "normal"}>
          {flight.handicappedDistanceKm.toFixed(1)} km
        </Text>
      </Tooltip>
      <Tooltip label="Scoring distance" fontSize="xs">
        <Text color="gray.500">({flight.scoringDistanceKm.toFixed(1)} km)</Text>
      </Tooltip>
      <Text color="gray.500">·</Text>
      <Tooltip label="Handicapped speed" fontSize="xs">
        <Text fontWeight={isSpeedScore ? "bold" : "normal"}>
          {flight.handicappedSpeedKph.toFixed(1)} kph
        </Text>
      </Tooltip>
      <Text color="gray.500">·</Text>
      {isPtsScore && (
        <>
          <Text fontWeight="bold">{score.value.toFixed(0)} pts</Text>
          <Text color="gray.500">·</Text>
        </>
      )}
      <Text>{flight.task}</Text>
      <HStack spacing={1}>
        <Link href={flight.ladderUrl} isExternal onClick={(e) => e.stopPropagation()}>
          <ExternalLinkIcon />
        </Link>
        <Link href={flight.igcUrl} isExternal onClick={(e) => e.stopPropagation()}>
          <ViewIcon />
        </Link>
      </HStack>
    </HStack>
  );
};

const WinnerDetails = ({
  data,
  flights,
  flightDetail,
}: {
  data: [string, string][];
  flights?: FlightDetail[];
  flightDetail?: SingleFlightDetail;
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    copyDataToClipboard(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box pl={4} pr={4} pb={3} pt={1}>
      <HStack align="start" spacing={4}>
        <Box flex={1}>
          {flights ? (
            <FlightTable flights={flights} />
          ) : flightDetail ? (
            <FlightSummary flight={flightDetail} />
          ) : (
            <SimpleGrid columns={2} spacing={1}>
              {data.map(([label, value]) => (
                <React.Fragment key={label}>
                  <Text fontSize="xs" color="gray.500">
                    {label}
                  </Text>
                  <Text fontSize="xs">
                    {value.startsWith("https://") ? (
                      <Link href={value} isExternal onClick={(e) => e.stopPropagation()}>
                        {value}
                      </Link>
                    ) : value}
                  </Text>
                </React.Fragment>
              ))}
            </SimpleGrid>
          )}
        </Box>
        <Tooltip label={copied ? "Copied!" : "Copy for spreadsheet"} closeOnClick={false}>
          <IconButton
            aria-label="Copy to clipboard"
            icon={copied ? <CheckIcon /> : <CopyIcon />}
            size="sm"
            variant="ghost"
            colorScheme={copied ? "green" : "gray"}
            onClick={handleCopy}
          />
        </Tooltip>
      </HStack>
    </Box>
  );
};

export default WinnerDetails;
