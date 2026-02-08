import React from "react";
import {
  Box,
  HStack,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Tooltip,
  Tr,
} from "@chakra-ui/react";
import { ExternalLinkIcon, ViewIcon } from "@chakra-ui/icons";
import type { FlightDetail, SingleFlightDetail } from "../lib/trophyCopyData";

const FlightTable = ({ flights }: { flights: FlightDetail[] }) => (
  <Table size="sm" variant="unstyled">
    <Tbody>
      {flights.map((f) => (
        <Tr key={f.ladderUrl}>
          <Td px={1} fontSize="xs">{f.date.toLocaleDateString()}</Td>
          <Td px={1} fontSize="xs">{f.task}</Td>
          <Td px={1} fontSize="xs" isNumeric>
            <Tooltip label="Scoring distance" fontSize="xs">
              <Text as="span">{f.distanceKm.toFixed(0)} km</Text>
            </Tooltip>
          </Td>
          <Td px={1} fontSize="xs" isNumeric>
            <Tooltip label="Handicapped speed" fontSize="xs">
              <Text as="span">{f.speedKph.toFixed(1)} kph</Text>
            </Tooltip>
          </Td>
          <Td px={1} fontSize="xs" isNumeric>
            <Tooltip label="Cross-country points" fontSize="xs">
              <Text as="span">{f.points.toFixed(0)} pts</Text>
            </Tooltip>
          </Td>
          <Td px={1} fontSize="xs">
            <HStack spacing={1}>
              <Link href={f.ladderUrl} isExternal onClick={(e) => e.stopPropagation()}>
                <ExternalLinkIcon verticalAlign="middle" />
              </Link>
              <Link href={f.igcUrl} isExternal onClick={(e) => e.stopPropagation()}>
                <ViewIcon verticalAlign="middle" />
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

  const distanceKm = isDistanceScore ? flight.handicappedDistanceKm : flight.scoringDistanceKm;
  const distanceLabel = isDistanceScore ? "Handicapped distance" : "Scoring distance";

  return (
    <HStack spacing={1} flexWrap="wrap" fontSize="xs" align="center">
      <Text>{flight.date.toLocaleDateString()}</Text>
      <Text color="gray.500">·</Text>
      <Text>{flight.task}</Text>
      <Text color="gray.500">·</Text>
      <Tooltip label="Handicapped speed" fontSize="xs">
        <Text fontWeight={isSpeedScore ? "bold" : "normal"}>
          {flight.handicappedSpeedKph.toFixed(1)} kph
        </Text>
      </Tooltip>
      <Text color="gray.500">·</Text>
      <Tooltip label={distanceLabel} fontSize="xs">
        <Text fontWeight={isDistanceScore ? "bold" : "normal"}>
          {distanceKm.toFixed(1)} km
        </Text>
      </Tooltip>
      <Text color="gray.500">·</Text>
      {isPtsScore && (
        <>
          <Text fontWeight="bold">{score.value.toFixed(0)} pts</Text>
          <Text color="gray.500">·</Text>
        </>
      )}
      <Text>{flight.gliderReg} · {flight.gliderType}</Text>
      <HStack spacing={1}>
        <Link href={flight.ladderUrl} isExternal onClick={(e) => e.stopPropagation()}>
          <ExternalLinkIcon verticalAlign="middle" />
        </Link>
        <Link href={flight.igcUrl} isExternal onClick={(e) => e.stopPropagation()}>
          <ViewIcon verticalAlign="middle" />
        </Link>
      </HStack>
    </HStack>
  );
};

const WinnerDetails = ({
  flights,
  flightDetail,
}: {
  flights?: FlightDetail[];
  flightDetail?: SingleFlightDetail;
}) => (
  <Box pl={4} pr={4} pb={3} pt={1}>
    {flights ? (
      <FlightTable flights={flights} />
    ) : flightDetail ? (
      <FlightSummary flight={flightDetail} />
    ) : null}
  </Box>
);

export default WinnerDetails;
