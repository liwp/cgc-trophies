import { Spinner } from "@chakra-ui/react";

function Loading() {
  return (
    <div>
      <Spinner size="xl" />
      <div>Loading flight data...</div>
    </div>
  );
}

export default Loading;
