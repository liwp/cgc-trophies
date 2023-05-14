import { ArrowLeftIcon, ArrowRightIcon } from "@chakra-ui/icons";
import { IconButton, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";

// There is one flight in the previous season, so we think 2007 is the first
// proper season that the ladder has data for.
const firstYear = 2007;

const Season = ({ season }) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <Stack spacing={4} direction="row" align="center">
      <IconButton
        aria-label="Previous season"
        icon={<ArrowLeftIcon />}
        isDisabled={season === firstYear}
        onClick={() =>
          router.replace({
            query: { ...router.query, season: season - 1 },
          })
        }
      />
      <span>{season}</span>
      <IconButton
        aria-label="Next season"
        icon={<ArrowRightIcon />}
        isDisabled={season === currentYear}
        onClick={() =>
          router.replace({
            query: { ...router.query, season: season + 1 },
          })
        }
      />
    </Stack>
  );
};

export default Season;
