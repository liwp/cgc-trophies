import React from "react";
import { Box, HStack, Link, Table, Text } from "@chakra-ui/react";
import { ExternalLink, Eye } from "lucide-react";
import Tooltip from "./ui/Tooltip";
import type { FlightDetail, SingleFlightDetail } from "../lib/trophyCopyData";

const FlightTable = ({ flights }: { flights: FlightDetail[] }) => (
  <Table.Root size="sm">
    <Table.Body>
      {flights.map((f) => (
        <Table.Row key={f.ladderUrl}>
          <Table.Cell px={1} fontSize="xs">
            {f.date.toLocaleDateString()}
          </Table.Cell>
          <Table.Cell px={1} fontSize="xs">
            {f.task}
          </Table.Cell>
          <Table.Cell px={1} fontSize="xs" textAlign="end">
            <Tooltip content="Scoring distance">
              <Text as="span" fontSize="xs">
                {f.distanceKm.toFixed(0)} km
              </Text>
            </Tooltip>
          </Table.Cell>
          <Table.Cell px={1} fontSize="xs" textAlign="end">
            <Tooltip content="Handicapped speed">
              <Text as="span" fontSize="xs">
                {f.speedKph.toFixed(1)} kph
              </Text>
            </Tooltip>
          </Table.Cell>
          <Table.Cell px={1} fontSize="xs" textAlign="end">
            <Tooltip content="Cross-country points">
              <Text as="span" fontSize="xs">
                {f.points.toFixed(0)} pts
              </Text>
            </Tooltip>
          </Table.Cell>
          <Table.Cell px={1} fontSize="xs">
            <HStack gap={1}>
              <Link
                href={f.ladderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink style={{ verticalAlign: "middle" }} />
              </Link>
              <Link
                href={f.igcUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye style={{ verticalAlign: "middle" }} />
              </Link>
            </HStack>
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table.Root>
);

const FlightSummary = ({ flight }: { flight: SingleFlightDetail }) => {
  const { score } = flight;
  const isDistanceScore = score.unit === "km";
  const isSpeedScore = score.unit === "kph";
  const isPtsScore = score.unit === "pts";

  const distanceKm = isDistanceScore
    ? flight.handicappedDistanceKm
    : flight.scoringDistanceKm;
  const distanceLabel = isDistanceScore
    ? "Handicapped distance"
    : "Scoring distance";

  return (
    <HStack gap={1} flexWrap="wrap" fontSize="xs" align="center">
      <Text>{flight.date.toLocaleDateString()}</Text>
      <Text color="gray.500">·</Text>
      <Text>{flight.task}</Text>
      <Text color="gray.500">·</Text>
      <Tooltip content="Handicapped speed">
        <Text fontWeight={isSpeedScore ? "bold" : "normal"}>
          {flight.handicappedSpeedKph.toFixed(1)} kph
        </Text>
      </Tooltip>
      <Text color="gray.500">·</Text>
      <Tooltip content={distanceLabel}>
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
      <Text>
        {flight.gliderReg} · {flight.gliderType}
      </Text>
      <HStack gap={1}>
        <Link
          href={flight.ladderUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink style={{ verticalAlign: "middle" }} />
        </Link>
        <Link
          href={flight.igcUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye style={{ verticalAlign: "middle" }} />
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
