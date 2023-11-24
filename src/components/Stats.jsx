import {
  Box,
  Center,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
} from "@chakra-ui/react";

import { calculateStats } from "../lib/stats";

const FlightCategory = ({ completed, label, total }) => {
  return (
    <Center>
      <Stat>
        <StatLabel>{label}</StatLabel>
        <StatNumber>{completed || 0}</StatNumber>
        <StatHelpText>
          Attempts
          <br />
          {total || 0}
        </StatHelpText>
      </Stat>
    </Center>
  );
};

const Stats = ({ flights, season }) => {
  const start = new Date(`${season}-01-01`);
  const end = new Date(`${season}-12-31`);

  const flightsInYear = flights.filter(
    ({ date }) => start <= date && date <= end,
  );

  const stats = calculateStats(flightsInYear);

  return (
    <Box minWidth="600px">
      <StatGroup>
        <FlightCategory label={"All Flights"} {...stats["open"]} />
        <FlightCategory label={"300 km"} {...stats["300km"]} />
        <FlightCategory label={"400 km"} {...stats["400km"]} />
        <FlightCategory label={"500 km"} {...stats["500km"]} />
        <FlightCategory label={"750 km"} {...stats["750km"]} />
      </StatGroup>
    </Box>
  );
};

export default Stats;
