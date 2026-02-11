import { Spinner } from "@chakra-ui/react";

function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Spinner size="xl" />
      <div>Loading flight data...</div>
    </div>
  );
}

export default Loading;
