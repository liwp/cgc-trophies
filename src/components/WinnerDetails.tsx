import React from "react";
import {
  Box,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";
import { copyDataToClipboard } from "../lib/trophyCopyData";

const WinnerDetails = ({ data }: { data: [string, string][] }) => {
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
        <SimpleGrid columns={2} spacing={1} flex={1}>
          {data.map(([label, value]) => (
            <React.Fragment key={label}>
              <Text fontSize="xs" color="gray.500">
                {label}
              </Text>
              <Text fontSize="xs">{value}</Text>
            </React.Fragment>
          ))}
        </SimpleGrid>
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
