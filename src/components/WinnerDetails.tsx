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
import type { FlightDetail } from "../lib/trophyCopyData";

const FlightTable = ({ flights }: { flights: FlightDetail[] }) => (
  <Table size="sm" variant="unstyled">
    <Thead>
      <Tr>
        <Th px={1}>Pilot</Th>
        <Th px={1}>Date</Th>
        <Th px={1} isNumeric>Pts</Th>
        <Th px={1} isNumeric>Dist</Th>
        <Th px={1} isNumeric>Speed</Th>
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

const WinnerDetails = ({
  data,
  flights,
}: {
  data: [string, string][];
  flights?: FlightDetail[];
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
